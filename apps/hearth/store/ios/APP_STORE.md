# Hearth App Store packet

Bundle ID: `com.willette.hearth`
Name: Hearth
Subtitle: Two people. One tiny daily quest.
Category: Lifestyle
Age: 4+
Encryption: ITSAppUsesNonExemptEncryption = false
Privacy URL: https://hearth-gc8u.onrender.com/privacy
Support URL: https://hearth-gc8u.onrender.com/install
Marketing URL: https://hearth-gc8u.onrender.com

## Description

Hearth is a private daily ritual for two people. One small quest a day, sealed until both of you answer. A shared streak. Notes when a question is not enough. Ember keeps the flame lit.

No ads. No feed. No one else in the room.

## Keywords

streak,couples,daily,ritual,questions,notes,relationship,private

## Promotional text

One tiny daily quest for the two of you. Ember keeps the streak lit.

## Review notes

This app is for two household members. Create a ritual, share the six-letter code with the second phone, set a PIN on each seat. Demo seats are not on production. Privacy policy is at /privacy.

## Upload

GitHub Action `testflight` on `johnspersonalgit/PersonalLife`.

Leftover bind (GitHub secrets UI, never chat):

- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `ASC_API_KEY_P8` (.p8 contents)
- repo variable `HEARTH_PUBLIC_URL` = `https://hearth-gc8u.onrender.com`

Then run the workflow, wait for Apple processing, invite John and Ariana in TestFlight. Public App Store listing is a later review step after the TestFlight build exists.

Tonight: both phones use Safari Add to Home Screen at `/install`.
