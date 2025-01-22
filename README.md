# AntGuessr (IrvineHacks Demo)

## Running Locally

1. Clone the repo: `git clone https://github.com/laggycomputer/antguessr`
   - Then ***C***hange ***D***irectory into the folder: `cd antguessr`
2. Install dependencies: `npm install`
3. Inside the `back` folder, create a `.env` file with the following variables:
   ```sh
   ANTEATER_API_TOKEN="[create token at dashboard.anteaterapi.com]"
   ANTEATER_API_ENDPOINT="https://anteaterapi.com"
   PORT="3939"
   # MONGO_URI is only used for the `mongo-complete` branch
   MONGO_URI="mongodb+srv://USERNAME:PASS@HOST/DB_NAME"
   ```
4. `npm run dev`, then navigate to http://localhost:3938

## MongoDB Branch

In our workshop, the `main` branch will be the starting point. We will modify our code to store our data in MongoDB.

To see the finished code example with MongoDB connection, check out the `mongo-complete` branch.

## Caveats

Since sessions are stored in memory in both the `main` and `mongo-complete` branches, making changes to the backend server remove any current sessions.
- This means you may encounter the game freezing – this is because the session no longer exists!
![Frozen Frontend](readme-assets/frozen.jpg)
- To fix this, simply reload the page. A new session will be created.
