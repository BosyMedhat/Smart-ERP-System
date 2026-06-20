"""
Supplier Intelligence & Recommendation Engine

No fake AI — all recommendations are derived from real data:
- Purchase history
- Supplier evaluations
- Supplier score

This module also defines the data structure for future
"Best Supplier Per Product" recommendations.
"""

from decimal import Decimal
from datetime import timedelta
from typing import Dict, List, Optional

from django.utils import timezone
from django.db.models import Avg, Count, Sum, F


BADGE_CHOICES = {
    'RECOMMENDED': 'Recommended',
    'GOOD': 'Good',
    'RISKY': 'Risky',
    'NEW': 'New',
}


class SupplierIntelligenceService:
    """
    Data-driven supplier intelligence service.
    """

    RATING_DIMENSIONS = [
        'delivery_rating',
        'quality_rating',
        'price_rating',
        'communication_rating',
    ]

    @classmethod
    def enrich_supplier(cls, supplier) -> Dict:
        """
        Build a recommendation/enrichment dict for a single supplier.
        """
        eval_qs = supplier.evaluations.all()
        purchase_qs = supplier.purchases.all()

        score = cls._compute_score(eval_qs)
        breakdown = cls._compute_breakdown(eval_qs)
        purchase_stats = cls._compute_purchase_stats(purchase_qs)
        badge = cls._compute_badge(score, purchase_stats, supplier)
        reason = cls._compute_reason(
            supplier,
            score,
            breakdown,
            purchase_stats,
            badge
        )

        return {
            'supplier_score': score,
            'rating_breakdown': breakdown,
            'purchase_count': purchase_stats['count'],
            'total_purchases': purchase_stats['total'],
            'latest_purchase_date': purchase_stats['latest_date'],
            'purchase_frequency': purchase_stats['frequency'],
            'badge': badge,
            'recommendation_reason': reason,
        }

    @classmethod
    def calculate_recommendations(cls) -> List[Dict]:
        """
        Return all suppliers ranked from best to worst.
        """
        from ..models import Supplier

        suppliers = Supplier.objects.prefetch_related(
            'evaluations', 'purchases'
        ).all()

        results = []
        for supplier in suppliers:
            data = cls.enrich_supplier(supplier)
            data['supplier_id'] = supplier.id
            data['supplier_name'] = supplier.name
            data['company'] = supplier.company
            data['balance'] = float(supplier.balance)
            results.append(data)

        # Rank by score descending; None treated as 0
        results.sort(
            key=lambda x: x['supplier_score'] if x['supplier_score'] is not None else 0,
            reverse=True
        )
        for idx, item in enumerate(results, start=1):
            item['rank'] = idx

        return results

    @classmethod
    def get_top_suppliers(cls) -> Dict[str, Optional[Dict]]:
        """
        Return top suppliers by different dimensions:
        - best_overall
        - best_quality
        - best_price
        - best_delivery
        """
        recommendations = cls.calculate_recommendations()
        if not recommendations:
            return {
                'best_overall': None,
                'best_quality': None,
                'best_price': None,
                'best_delivery': None,
            }

        best_overall = recommendations[0]

        best_quality = max(
            recommendations,
            key=lambda x: x['rating_breakdown'].get('quality', 0) or 0
        )
        best_price = max(
            recommendations,
            key=lambda x: x['rating_breakdown'].get('price', 0) or 0
        )
        best_delivery = max(
            recommendations,
            key=lambda x: x['rating_breakdown'].get('delivery', 0) or 0
        )

        return {
            'best_overall': best_overall,
            'best_quality': best_quality,
            'best_price': best_price,
            'best_delivery': best_delivery,
        }

    @classmethod
    def _compute_score(cls, eval_qs) -> Optional[Decimal]:
        evals = list(eval_qs)
        if not evals:
            return None
        total = sum(e.average_score for e in evals)
        return round(total / Decimal(len(evals)), 2)

    @classmethod
    def _compute_breakdown(cls, eval_qs) -> Dict[str, Optional[float]]:
        breakdown = {}
        for dim in cls.RATING_DIMENSIONS:
            values = [getattr(e, dim) for e in eval_qs if getattr(e, dim) is not None]
            if values:
                breakdown[dim.replace('_rating', '')] = round(
                    sum(values) / len(values), 2
                )
            else:
                breakdown[dim.replace('_rating', '')] = None
        return breakdown

    @classmethod
    def _compute_purchase_stats(cls, purchase_qs) -> Dict:
        purchases = list(purchase_qs)
        count = len(purchases)
        total = sum(p.total_amount for p in purchases) if purchases else Decimal('0')

        latest = None
        if purchases:
            latest_purchase = max(purchases, key=lambda p: p.created_at)
            latest = latest_purchase.created_at.date().isoformat()

        # Frequency: average purchases per month over the supplier lifetime
        # or last 6 months, whichever is shorter.
        frequency = None
        if purchases:
            today = timezone.now().date()
            first_purchase = min(p.created_at.date() for p in purchases)
            months_active = max(
                1,
                (today.year - first_purchase.year) * 12 +
                (today.month - first_purchase.month) + 1
            )
            frequency = round(count / months_active, 2)

        return {
            'count': count,
            'total': float(total),
            'latest_date': latest,
            'frequency': frequency,
        }

    @classmethod
    def _compute_badge(
        cls,
        score: Optional[Decimal],
        purchase_stats: Dict,
        supplier
    ) -> str:
        count = purchase_stats['count']
        latest_date = purchase_stats['latest_date']

        if count == 0:
            return BADGE_CHOICES['NEW']

        if score is None:
            return BADGE_CHOICES['RISKY']

        score_float = float(score)

        if score_float >= 4.2 and count >= 3:
            if latest_date:
                latest = timezone.datetime.strptime(
                    latest_date, '%Y-%m-%d'
                ).date()
                days_since = (timezone.now().date() - latest).days
                if days_since <= 60:
                    return BADGE_CHOICES['RECOMMENDED']
            return BADGE_CHOICES['GOOD']

        if score_float >= 3.5:
            return BADGE_CHOICES['GOOD']

        if score_float < 3.0:
            return BADGE_CHOICES['RISKY']

        # Has debt and no recent purchases
        if supplier.balance > 0 and latest_date:
            latest = timezone.datetime.strptime(
                latest_date, '%Y-%m-%d'
            ).date()
            if (timezone.now().date() - latest).days > 90:
                return BADGE_CHOICES['RISKY']

        return BADGE_CHOICES['GOOD']

    @classmethod
    def _compute_reason(
        cls,
        supplier,
        score: Optional[Decimal],
        breakdown: Dict,
        purchase_stats: Dict,
        badge: str
    ) -> str:
        """
        Build a recommendation reason from real data only.
        """
        parts = []
        count = purchase_stats['count']
        total = purchase_stats['total']
        latest = purchase_stats['latest_date']

        if badge == BADGE_CHOICES['NEW']:
            return 'لا توجد مشتريات مسجلة بعد — مورد جديد.'

        if score is not None:
            parts.append(f'متوسط التقييم {score:.2f} من 5')

        if count > 0:
            parts.append(f'{count} مشتريات بإجمالي {total:,.2f} ج.م')

        if latest:
            parts.append(f'آخر فاتورة بتاريخ {latest}')

        best_dim = None
        best_value = 0
        for dim, value in breakdown.items():
            if value and value > best_value:
                best_value = value
                best_dim = dim

        if best_dim and best_value:
            dim_labels = {
                'delivery': 'الاستلام',
                'quality': 'الجودة',
                'price': 'السعر',
                'communication': 'التواصل',
            }
            parts.append(
                f'أفضل بُعد: {dim_labels.get(best_dim, best_dim)} ({best_value:.2f})'
            )

        if supplier.balance > 0:
            parts.append(
                f'دين مستحق: {float(supplier.balance):,.2f} ج.م'
            )

        return ' — '.join(parts) if parts else 'بيانات غير كافية للتوصية.'


class SupplierProductRanking:
    """
    Future architecture placeholder for "Best Supplier Per Product".

    Data structure:
        product_id: int
        supplier_id: int
        avg_cost_price: Decimal
        avg_quality: float
        avg_delivery: float
        total_purchases: int
        last_purchase_date: date
        rank: int
        recommendation_reason: str

    Service methods to implement in future release:
        - build_rankings_for_product(product_id)
        - get_best_supplier_for_product(product_id)
        - get_product_comparison(product_id)
    """
    pass
