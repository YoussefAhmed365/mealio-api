# Weekly Meal Planner API

A robust RESTful API built with Node.js and Express.js for managing weekly meal plans, user preferences, and system notifications. This application serves as the backend for a meal planning platform, allowing users to generate meal plans based on their dietary needs and preferences.

## Features

- **User Authentication:** Secure registration and login using JWT (JSON Web Tokens) and HttpOnly cookies.
- **Profile Management:** Users can view and update their profile information.
- **Meal Planning:** Create and retrieve weekly meal plans with detailed daily breakdowns (ingredients, preparation steps).
- **Dietary Preferences:** Save and update meal preferences to tailor meal plans.
- **Notifications:** System notifications for users (create, read, delete).

## Technology Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ODM
- **Authentication:** [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) & [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Utilities:** [cookie-parser](https://www.npmjs.com/package/cookie-parser), [cors](https://www.npmjs.com/package/cors), [dotenv](https://www.npmjs.com/package/dotenv)

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- MongoDB (Local instance or Atlas URI)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file in the root directory and add the following variables:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/mealplanner
    JWT_SECRET=your_super_secret_jwt_key
    FRONTEND_URL=http://localhost:5173 # Optional, for CORS configuration
    ```

### Running the Application

- **Development Mode** (using nodemon):
  ```bash
  npm run dev
  ```

- **Production Mode**:
  ```bash
  npm start
  ```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

All routes are prefixed with `/api`.

### Users (`/api/users`)

| Method | Endpoint    | Description                     | Auth Required |
| :----- | :---------- | :------------------------------ | :------------ |
| POST   | `/register` | Register a new user             | No            |
| POST   | `/login`    | Authenticate user and get token | No            |
| POST   | `/logout`   | Logout user and clear cookie    | No            |
| GET    | `/profile`  | Get user profile                | Yes           |
| PUT    | `/profile`  | Update user profile             | Yes           |

### Meal Plans (`/api/meal-plans`)

| Method | Endpoint   | Description                      | Auth Required |
| :----- | :--------- | :------------------------------- | :------------ |
| POST   | `/`        | Create a new weekly meal plan    | Yes           |
| GET    | `/myplans` | Retrieve current user's meal plans| Yes           |

### Meal Preferences (`/api/meal-preferences`)

| Method | Endpoint | Description                | Auth Required |
| :----- | :------- | :------------------------- | :------------ |
| POST   | `/`      | Save meal preferences      | Yes           |
| PUT    | `/`      | Update meal preferences    | Yes           |

### Notifications (`/api/notifications`)

| Method | Endpoint        | Description                   | Auth Required |
| :----- | :-------------- | :---------------------------- | :------------ |
| POST   | `/send`         | Send a notification (System)  | Yes           |
| GET    | `/get`          | Get all notifications for user| Yes           |
| PUT    | `/:id/read`     | Mark a notification as read   | Yes           |
| DELETE | `/delete/:id`   | Delete a specific notification| Yes           |
| DELETE | `/clear-all`    | Clear all notifications       | Yes           |

## License

This project is licensed under the ISC License.
