### Admin features

- Added: operations gets an email when an owner uploads a pink form or submits a car value counter proposal during onboarding.
- Added: creating a car onboarding emails operations, and emails the owner when one is already set.

### Public features

- Added: owners receive a welcome email when their car onboarding is created, or when an admin assigns them as owner for the first time.

### Technical

- Added `button-email` templates `car-onboarding-pink-form-uploaded-notification` and `car-onboarding-car-value-counter-notification` sent to `SUPPORT_REPLY_TO_EMAIL`.
- Added `button-email` templates `car-onboarding-created-email` (owner) and `car-onboarding-created-notification` (backoffice via `SUPPORT_REPLY_TO_EMAIL`).
