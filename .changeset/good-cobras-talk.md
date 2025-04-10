---
"jazz-react-auth-clerk": patch
"jazz-auth-clerk": patch
"jazz-expo": patch
---

Rewrite the auth management making Clerk the source of truth. This fixes the logOut issues as well as making the logout work from the Clerk APIs. When the Clerk session expires now the user is correctly logged out from Jazz\

