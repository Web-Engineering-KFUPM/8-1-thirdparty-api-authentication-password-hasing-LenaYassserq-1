# Secure Weather Dashboard Lab

> **Note:**
> Please follow the `server.js` file to implement the TODOs.
>  
> **Due Date:** 20 April, 2026, **8:59 PM**

---

## Overview  
In this lab, you will build a secure backend that provides weather information by integrating:  
- User registration & login  
- Password hashing  
- Token‑based authentication  
- Calling a third‑party weather API  

You must complete the TODOs in `server.js` to implement secure user authentication and a protected weather endpoint.

---

## Reading Assignment  
Before starting the lab, review the following ZyBooks sections:

1. 8.1 Third-party web APIs

2. 8.2 Token-based user authentication

3. 8.3 Password hashing

---

## Concepts Used in This Lab

### 1. Third-Party Web API Introduction  
A third-party API allows you to access data or services provided by another company.  
In this lab, our backend uses the **GoWeather API** to fetch real-time weather without storing or generating weather data on our own server.  
Key ideas include:
- Making HTTP requests using `fetch()`
- Building URLs with query parameters
- Handling API responses (JSON)
- Dealing with errors when third-party services fail

---

### 2. User-Based Token Authentication  
User-based authentication ensures only logged-in users can access protected server routes.  
Key ideas include:
- Verifying user identity when they log in
- Issuing a token after correct credentials
- Requiring that token for private routes
- Rejecting requests missing or providing invalid tokens

This helps protect sensitive resources (in this case, the weather API).

---

### 3. JSON Web Token (JWT)  
JWTs are digitally signed tokens that store user data securely.  
A token contains:
- **Header:** describes encryption method  
- **Payload:** contains user info (e.g., email)  
- **Signature:** verifies token authenticity  

JWT Advantages:
- Stateless (no session storage needed)
- Compact and easy to send in HTTP headers
- Auto-expiring tokens increase security  
- Used by almost all modern web apps for login/authentication  

In this lab:
- Users receive a token upon successful login  
- To access `/weather`, students must send:  
  **Authorization: Bearer <token>**  

---

### 4. Password Hashing & Security (bcryptjs)  
Plaintext passwords MUST NEVER be stored directly.

#### Why Hashing?
- If database leaks, attackers cannot read real passwords.
- Hash functions are irreversible.
- bcrypt adds **salt**, making each password unique even if two users have the same password.

#### Password Cracking  
Techniques like dictionary attacks, rainbow tables, and brute force are used to guess weak passwords.  
Hashing makes these attacks much harder.

#### bcryptjs  
bcryptjs is a library that:
- Hashes passwords securely  
- Automatically generates salt  
- Makes passwords slow to crack due to computational cost  

In the lab:
- Registration stores a **hashed password**, not the raw string.
- Login compares the raw password to the stored **bcrypt hash**.

---

## Checklist Before Submitting the Lab

- [ ] **Implemented `POST /register` route** with validation and bcrypt hashing.
- [ ] **Implemented `POST /login` route** with password comparison and JWT token creation.
- [ ] **Implemented `GET /weather` protected route** using Authorization header.
- [ ] Tested **Authorization header** in Postman:  
      `Authorization: Bearer <your_token>`
- [ ] Tested all routes with **Postman or Thunder Client**.
- [ ] Checked behavior for missing fields, duplicate users, invalid password, missing token, or missing city.
- [ ] Proper **HTTP status codes** used (200, 201, 400, 401, 500).
- [ ] Code is **clean, readable, and correctly commented** according to TODO instructions.
- [ ] Server runs without errors (`node server.js`).

---
