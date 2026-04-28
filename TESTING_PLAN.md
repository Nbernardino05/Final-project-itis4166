# Testing Plan — Roommate Management API

Open Swagger UI at: `http://localhost:3000/api-docs` (local) or your Render URL + `/api-docs`.

---

## Seed Credentials

| User | Email | Password | Role | Household |
|------|-------|----------|------|-----------|
| Nina Bernardino | nina@example.com | Password123! | admin | Arcadia House (id: 1) |
| Alexis Pearson | alexis@example.com | Password123! | member | Arcadia House (id: 1) |
| Marcus Rivera | marcus@example.com | Password123! | member | Arcadia House (id: 1) |
| Jordan Lee | jordan@example.com | Password123! | admin | Maple Street Home (id: 2) |
| Sam Chen | sam@example.com | Password123! | member | Maple Street Home (id: 2) |
| New User | newuser@example.com | Password123! | member | none |

> **Arcadia House** has household id **1**, chore ids **1–4**, expense ids **1–3**.  
> **Maple Street Home** has household id **2**, chore ids **5–6**, expense id **4**.

---

## How to Authenticate in Swagger UI

1. Call `POST /api/auth/login` with a user's credentials.
2. Copy the `token` value from the response body.
3. Click the **Authorize** button (top right of Swagger UI).
4. In the **BearerAuth** field, paste the token and click **Authorize**.
5. All subsequent requests will include the token automatically.

---

## 1. POST /api/auth/signup

**Access Control:** Public

### Success — 201 Created
- Click **Try it out**
- Body:
  ```json
  { "name": "Test User", "email": "test@example.com", "password": "Password123!" }
  ```
- Execute
- Expect 201 with `token` and `user` object (householdId: null, role: "member")

### 400 Bad Request — Missing field
- Remove `name` from body
- Expect 400: `"name is required"`

### 400 Bad Request — Invalid email
- Set email to `"notanemail"`
- Expect 400: `"A valid email is required"`

### 400 Bad Request — Password too short
- Set password to `"abc"`
- Expect 400: `"password must be at least 6 characters"`

### 409 Conflict — Email taken
- Use a seed email: `"nina@example.com"`
- Expect 409: `"Email already registered"`

---

## 2. POST /api/auth/login

**Access Control:** Public

### Success — 200 OK
- Body:
  ```json
  { "email": "nina@example.com", "password": "Password123!" }
  ```
- Expect 200 with `token` and user (role: "admin", householdId: 1)

### 400 Bad Request — Missing fields
- Omit `password`
- Expect 400: `"email and password are required"`

### 401 Unauthorized — Wrong password
- Body:
  ```json
  { "email": "nina@example.com", "password": "wrongpassword" }
  ```
- Expect 401: `"Invalid credentials"`

### 401 Unauthorized — Unknown email
- Body:
  ```json
  { "email": "ghost@example.com", "password": "Password123!" }
  ```
- Expect 401: `"Invalid credentials"`

---

## 3. POST /api/households

**Access Control:** Any authenticated user **not** already in a household

### Setup
Login as **newuser@example.com** and authorize.

### Success — 201 Created
- Body: `{ "name": "New House" }`
- Expect 201: `{ "id": <new_id>, "name": "New House" }`

### 400 Bad Request — Missing name
- Body: `{}`
- Expect 400: `"name is required"`

### 401 Unauthorized — No token
- Remove authorization
- Expect 401

### 409 Conflict — Already in a household
- Login as **nina@example.com** (she is already in Arcadia House) and authorize
- Body: `{ "name": "Another House" }`
- Expect 409: `"You already belong to a household"`

---

## 4. GET /api/households

**Access Control:** Any authenticated user

### Success (admin sees all) — 200 OK
- Login as **nina@example.com** (admin) and authorize
- Execute
- Expect 200: array including Arcadia House (memberCount: 3) and Maple Street Home (memberCount: 2)

### Success (member sees own only) — 200 OK
- Login as **alexis@example.com** (member) and authorize
- Execute
- Expect 200: array with only Arcadia House

### 401 Unauthorized
- Remove authorization
- Expect 401

---

## 5. GET /api/households/{id}

**Access Control:** Member of the household

### Setup
Login as **nina@example.com** and authorize.

### Success — 200 OK
- id: `1`
- Expect 200: `{ "id": 1, "name": "Arcadia House", "members": [...] }` with all 3 members

### 400 Bad Request — Invalid ID
- id: `-5`
- Expect 400: `"ID must be a positive integer"`

### 401 Unauthorized
- Remove authorization, id: `1`
- Expect 401

### 403 Forbidden — Not a member
- Login as **jordan@example.com** (member of household 2) and authorize
- id: `1`
- Expect 403: `"You are not a member of this household"`

### 404 Not Found
- id: `9999`
- Expect 404: `"Household not found"`

---

## 6. PUT /api/households/{id}

**Access Control:** Household admin

### Setup
Login as **nina@example.com** (admin of household 1) and authorize.

### Success — 200 OK
- id: `1`, body: `{ "name": "Arcadia Home (Updated)" }`
- Expect 200: `{ "id": 1, "name": "Arcadia Home (Updated)" }`

### 400 Bad Request — Missing name
- id: `1`, body: `{}`
- Expect 400

### 401 Unauthorized
- Remove authorization
- Expect 401

### 403 Forbidden — Not admin
- Login as **alexis@example.com** (member) and authorize
- id: `1`, body: `{ "name": "Something" }`
- Expect 403: `"Only the household admin can update it"`

### 403 Forbidden — Admin of different household
- Login as **jordan@example.com** (admin of household 2) and authorize
- id: `1`
- Expect 403

### 404 Not Found
- Login as **nina@example.com**, id: `9999`
- Expect 404

---

## 7. DELETE /api/households/{id}

**Access Control:** Household admin

> **Note:** Running this will delete the household. Re-run the seed script to restore data.

### Setup
Login as **jordan@example.com** (admin of household 2) and authorize.

### Success — 200 OK
- id: `2`
- Expect 200: `{ "id": 2, "name": "Maple Street Home" }`
- Jordan and Sam will now have householdId: null, role: "member"

### 401 Unauthorized
- Remove authorization, id: `1`
- Expect 401

### 403 Forbidden — Not admin
- Login as **alexis@example.com** and authorize
- id: `1`
- Expect 403

### 404 Not Found
- Login as **nina@example.com**, id: `9999`
- Expect 404

---

## 8. POST /api/households/{householdId}/chores

**Access Control:** Any member of the household

### Setup
Login as **nina@example.com** and authorize.

### Success — 201 Created
- householdId: `1`
- Body: `{ "name": "Sweep porch", "assignedTo": 2 }`
- Expect 201: chore with assignedTo `{ "id": 2, "name": "Alexis Pearson" }`, householdId: 1

### Success — No assignee
- Body: `{ "name": "Clean garage" }`
- Expect 201: chore with assignedTo: null

### 400 Bad Request — Missing name
- Body: `{ "assignedTo": 2 }`
- Expect 400: `"name is required"`

### 400 Bad Request — Assignee not in household
- Body: `{ "name": "Test", "assignedTo": 4 }` (Jordan is in household 2, not 1)
- Expect 400: `"assignedTo must be a member of this household"`

### 401 Unauthorized
- Remove authorization
- Expect 401

### 403 Forbidden — Not a member
- Login as **jordan@example.com** (household 2) and authorize
- householdId: `1`
- Expect 403

### 404 Not Found
- householdId: `9999`
- Expect 404

---

## 9. GET /api/households/{householdId}/chores

**Access Control:** Any member of the household

### Setup
Login as **nina@example.com** and authorize.

### Success — 200 OK
- householdId: `1`
- Expect 200: array of 4 chores with name, status, assignedTo

### 400 Bad Request — Invalid ID
- householdId: `0`
- Expect 400

### 401 Unauthorized
- Remove authorization
- Expect 401

### 403 Forbidden
- Login as **jordan@example.com** and authorize, householdId: `1`
- Expect 403

### 404 Not Found
- householdId: `9999`
- Expect 404

---

## 10. GET /api/households/{householdId}/chores/{id}

**Access Control:** Any member of the household

### Setup
Login as **nina@example.com** and authorize.

### Success — 200 OK
- householdId: `1`, id: `1`
- Expect 200: `{ "id": 1, "name": "Vacuum living room", "status": false, "assignedTo": { "id": 2, "name": "Alexis Pearson" }, "householdId": 1 }`

### 400 Bad Request — Invalid chore ID
- householdId: `1`, id: `-1`
- Expect 400

### 403 Forbidden
- Login as **jordan@example.com** and authorize, householdId: `1`, id: `1`
- Expect 403

### 404 Not Found
- householdId: `1`, id: `9999`
- Expect 404

---

## 11. PUT /api/households/{householdId}/chores/{id}

**Access Control:** Assigned user OR household admin

### Setup — Mark chore complete as assigned user
Login as **alexis@example.com** (assigned to chore 1) and authorize.

### Success (assigned user) — 200 OK
- householdId: `1`, id: `1`
- Body: `{ "status": true }`
- Expect 200: chore with status: true

### Success (admin) — 200 OK
- Login as **nina@example.com** (admin) and authorize
- householdId: `1`, id: `1`
- Body: `{ "name": "Vacuum entire house", "status": false, "assignedTo": 3 }`
- Expect 200: updated chore with new name, status, and assignedTo Marcus

### 400 Bad Request — No fields
- Body: `{}`
- Expect 400: `"Provide at least one field to update"`

### 400 Bad Request — Invalid assignee
- Body: `{ "assignedTo": 4 }` (Jordan not in household 1)
- Expect 400

### 400 Bad Request — Invalid status type
- Body: `{ "status": "done" }`
- Expect 400: `"status must be a boolean"`

### 401 Unauthorized
- Remove authorization
- Expect 401

### 403 Forbidden — Unrelated member
- Login as **marcus@example.com** (not assigned to chore 1) and authorize
- householdId: `1`, id: `1`
- Body: `{ "status": true }`
- Expect 403: `"Only the assigned user or household admin can update this chore"`

### 404 Not Found
- householdId: `1`, id: `9999`
- Expect 404

---

## 12. DELETE /api/households/{householdId}/chores/{id}

**Access Control:** Assigned user OR household admin

### Setup
Login as **nina@example.com** (admin) and authorize.

### Success (admin) — 200 OK
- householdId: `1`, id: `4` (Do laundry)
- Expect 200: `{ "id": 4, "name": "Do laundry" }`

### Success (assigned user) — 200 OK
- Login as **alexis@example.com** (assigned to chore 1) and authorize
- householdId: `1`, id: `1`
- Expect 200: `{ "id": 1, "name": "Vacuum living room" }`

### 400 Bad Request
- householdId: `1`, id: `abc` (or use `-1`)
- Expect 400

### 401 Unauthorized
- Remove authorization
- Expect 401

### 403 Forbidden — Unrelated member
- Login as **marcus@example.com** and authorize
- householdId: `1`, id: `2` (Take out trash — assigned to Nina)
- Expect 403

### 404 Not Found
- householdId: `1`, id: `9999`
- Expect 404

---

## 13. POST /api/households/{householdId}/expenses

**Access Control:** Any member of the household

### Setup
Login as **nina@example.com** and authorize.

### Success — 201 Created
- householdId: `1`
- Body: `{ "name": "Water bill", "cost": 45 }`
- Expect 201: expense with createdBy Nina, splitAmount: 15 (45 / 3 members), memberCount: 3

### 400 Bad Request — Missing name
- Body: `{ "cost": 50 }`
- Expect 400: `"name is required"`

### 400 Bad Request — Non-positive cost
- Body: `{ "name": "Test", "cost": -10 }`
- Expect 400: `"cost must be a positive number"`

### 400 Bad Request — Cost is not a number
- Body: `{ "name": "Test", "cost": "fifty" }`
- Expect 400

### 401 Unauthorized
- Remove authorization
- Expect 401

### 403 Forbidden
- Login as **jordan@example.com** and authorize, householdId: `1`
- Expect 403

### 404 Not Found
- householdId: `9999`
- Expect 404

---

## 14. GET /api/households/{householdId}/expenses

**Access Control:** Any member of the household

### Setup
Login as **nina@example.com** and authorize.

### Success — 200 OK
- householdId: `1`
- Expect 200: array of 3 expenses, each with splitAmount = cost/3

### 400 Bad Request
- householdId: `0`
- Expect 400

### 401 Unauthorized
- Remove authorization
- Expect 401

### 403 Forbidden
- Login as **jordan@example.com**, householdId: `1`
- Expect 403

### 404 Not Found
- householdId: `9999`
- Expect 404

---

## 15. GET /api/households/{householdId}/expenses/{id}

**Access Control:** Any member of the household

### Setup
Login as **nina@example.com** and authorize.

### Success — 200 OK
- householdId: `1`, id: `1`
- Expect 200: `{ "id": 1, "name": "Groceries", "cost": 90, "createdBy": { "id": 1, "name": "Nina Bernardino" }, "createdAt": "...", "householdId": 1, "splitAmount": 30, "memberCount": 3 }`

### 400 Bad Request
- householdId: `1`, id: `-1`
- Expect 400

### 403 Forbidden
- Login as **jordan@example.com**, householdId: `1`, id: `1`
- Expect 403

### 404 Not Found
- householdId: `1`, id: `9999`
- Expect 404

---

## 16. PUT /api/households/{householdId}/expenses/{id}

**Access Control:** Expense creator OR household admin

### Setup
Login as **alexis@example.com** (creator of expense 2) and authorize.

### Success (creator) — 200 OK
- householdId: `1`, id: `2`
- Body: `{ "name": "Internet + streaming", "cost": 75 }`
- Expect 200: `{ "id": 2, "name": "Internet + streaming", "cost": 75 }`

### Success (admin) — 200 OK
- Login as **nina@example.com** (admin) and authorize
- householdId: `1`, id: `2`
- Body: `{ "cost": 80 }`
- Expect 200: updated expense

### 400 Bad Request — No fields
- Body: `{}`
- Expect 400: `"Provide at least one field to update"`

### 400 Bad Request — Non-positive cost
- Body: `{ "cost": 0 }`
- Expect 400

### 401 Unauthorized
- Remove authorization
- Expect 401

### 403 Forbidden — Unrelated member
- Login as **marcus@example.com** and authorize (not creator of expense 2)
- householdId: `1`, id: `2`
- Body: `{ "cost": 100 }`
- Expect 403: `"Only the creator or household admin can update this expense"`

### 404 Not Found
- householdId: `1`, id: `9999`
- Expect 404

---

## 17. DELETE /api/households/{householdId}/expenses/{id}

**Access Control:** Expense creator OR household admin

### Setup
Login as **nina@example.com** (admin and creator of expense 1) and authorize.

### Success (admin/creator) — 200 OK
- householdId: `1`, id: `1`
- Expect 200: `{ "id": 1, "name": "Groceries" }`

### Success (creator, non-admin) — 200 OK
- Login as **alexis@example.com** (creator of expense 2) and authorize
- householdId: `1`, id: `2`
- Expect 200: `{ "id": 2, "name": "Internet bill" }`

### 400 Bad Request
- householdId: `1`, id: `-1`
- Expect 400

### 401 Unauthorized
- Remove authorization
- Expect 401

### 403 Forbidden — Unrelated member
- Login as **marcus@example.com** and authorize
- householdId: `1`, id: `3` (Cleaning supplies — created by Marcus is actually ok, so use expense created by someone else)
- Try id: `1` (created by Nina, Marcus is neither creator nor admin of the expense from Nina's perspective — Marcus is a plain member)
- Expect 403

### 404 Not Found
- householdId: `1`, id: `9999`
- Expect 404
