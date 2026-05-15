# Security Spec for Dashboard Studies

## 1. Data Invariants
- A map document must have a `mapId`.
- Other fields present should be coordinate keys representing number of safe closures.

## 2. Dirty Dozen Payloads
- Ghost fields on update
- Injecting massive string for map ID
- Unauthenticated write to /studies/BER
- Spoofed user trying to update points
- Null mapId
- Array injected into point counts

## 3. Test Runner 
Will be defined in `firestore.rules.test.ts`.
