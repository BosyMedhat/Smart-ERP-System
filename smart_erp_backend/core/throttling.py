"""
Method-aware throttling (ERP-STABILITY-PERFORMANCE-003).

Rationale
---------
The previous flat ``user: 1000/day`` rate counted every authenticated
request equally. Legitimate UI polling (dashboard refresh, product list,
alerts bell) is all GET traffic and could exhaust the daily budget during
a normal working day — while writes (the risky operations) got no special
treatment.

These classes split that single scope into method-aware scopes:

- ``read_burst``  — caps per-minute read rate. Generous enough for
  interactive navigation bursts, tight enough to break a runaway retry
  loop.
- ``read_daily``  — caps total read volume per user/day.
- ``write``       — unchanged daily budget for mutations (POST/PUT/PATCH/
  DELETE). This is the rate that actually protects financial integrity.

Anonymous traffic keeps the separate ``anon`` scope (brute-force
protection for /login/).
"""
from rest_framework.throttling import UserRateThrottle

SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')


class ReadBurstThrottle(UserRateThrottle):
    """Per-minute read rate — burst control for authenticated GETs."""

    scope = 'read_burst'

    def allow_request(self, request, view):
        if request.method not in SAFE_METHODS:
            return True
        return super().allow_request(request, view)


class ReadDailyThrottle(UserRateThrottle):
    """Daily read rate — volume cap for authenticated GETs."""

    scope = 'read_daily'

    def allow_request(self, request, view):
        if request.method not in SAFE_METHODS:
            return True
        return super().allow_request(request, view)


class WriteRateThrottle(UserRateThrottle):
    """Daily write rate — protects mutations only."""

    scope = 'write'

    def allow_request(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return super().allow_request(request, view)
