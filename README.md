# igdb-api

[IGDB](https://www.igdb.com/) Proxy API.

Being used by: [game-search-expo](https://github.com/nunogois/game-search-expo)

## Redux port forwarding

In case of remote Redux, it is possible to run it with SSH port forwarding:

> ssh -L 6379:127.0.0.1:6379 username@server

# 📌 To Do

- [x] Create repo;
- [x] Basic setup;
- [x] GET /;
- [x] GET /games; (supporting popular, search and id requests)

## v1.1

- [x] Redis cache;
- [x] Cleanup;

## v1.2

- [x] Better initial query;
- [x] OpenCritic;
- [x] HowLongToBeat;
- [ ] TypeScript;
- [ ] Cleanup;
