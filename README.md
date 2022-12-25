# FACEIT Connect

Links a TeamSpeak identity to a FACEIT account.
Also acts as a bot to create channels for lobbies in the SAW portuguese community clan.

TODO: use TypeScript

## .env

- `ALLOWED_DOMAINS` array for cors
- `APP_URL` URL to redirect on oauth login
- `PORT` listening port (default: 3000)
- `DB_NAME` DB name
- `DB_HOST` DB host
- `DB_PW` DB password
- `DB_USER` DB user
- `FACEIT_CLIENTID` FACEIT oauth
- `FACEIT_CLIENTSECRET` FACEIT oauth
- `USERTOKEN` user login token to access clan's lobbys
- `TS3_HOST` ts server hostname
- `TS3_QUERYPORT` ts server query port
- `TS3_SERVERPORT` ts server port
- `TS3_USERNAME` ts server query username
- `TS3_PW` ts server query password
- `LINKED_GID` group id to identify linked clients
- `LOBBY_PARENT_CID` parent channel id to create lobby sub channels
- `ENABLE_PARTY` `true` to create channels for parties
- `LOBBY_MEMBER_CHANNELGID` channel group id with permission to join channels >= 55
- `LOBBY_LEADER_CHANNELGID` channel group id for lobby leaders with permission to kick from the channel
- `DEFAULT_CHANNELGID` default channel group id
- `TEST` (optional) define this to use `!getcid` to get the current channel id
