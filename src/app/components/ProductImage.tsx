import { useState } from 'react';
import { Package } from 'lucide-react';

/**
 * ProductImage (ERP-PORTAL-UX-ARCHITECTURE-002A, Task 5)
 *
 * Displays a product's uploaded image when available/valid; otherwise
 * renders a neutral, brand-consistent fallback — never the browser's
 * broken-image icon and never an external placeholder service.
 *
 * Usage:
 *   <ProductImage src={product.image} alt={product.name} size="md" />
 *   <ProductImage src={product.image} alt={product.name} className="w-full h-40" />
 */

export interface ProductImageProps {
  /** Image URL — may be undefined/null when the product has no image. */
  src?: string | null;
  alt?: string;
  /** Preset square size: sm=32px thumb, md=48px, lg=96px, xl=160px. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Extra classes — merged onto the outer box (which keeps aspect). */
  className?: string;
  /** object-fit for the real image. Defaults to 'cover'. */
  fit?: 'cover' | 'contain';
  /** Corner rounding applied to both image & fallback. */
  rounded?: string;
}

const SIZE_PX: Record<NonNullable<ProductImageProps['size']>, number> = {
  sm: 32,
  md: 48,
  lg: 96,
  xl: 160,
};

function isUsableSrc(src?: string | null): src is string {
  if (!src) return false;
  const s = src.trim();
  return s !== '' && s !== 'null' && s !== 'undefined';
}

export function ProductImage({
  src,
  alt = '',
  size,
  className = '',
  fit = 'cover',
  rounded = 'rounded-lg',
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  const dimensionStyle =
    size != null
      ? { width: SIZE_PX[size], height: SIZE_PX[size], minWidth: SIZE_PX[size] }
      : undefined;

  const boxCls = `relative overflow-hidden ${rounded} ${className}`;

  if (!isUsableSrc(src) || failed) {
    // Neutral fallback — local, no network, works on light & dark surfaces.
    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 40 : size === 'xl' ? 64 : 22;
    return (
      <div
        role="img"
        aria-label={alt}
        style={dimensionStyle}
        className={`${boxCls} flex items-center justify-center bg-muted text-muted-foreground/60 border border-border`}
      >
        <Package size={iconSize} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div style={dimensionStyle} className={boxCls}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        onError={() => setFailed(true)}
        className="w-full h-full"
        style={{ objectFit: fit }}
      />
    </div>
  );
}

export default ProductImage;
