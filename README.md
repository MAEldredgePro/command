# Project 'command': Chat server enhancements - NodeJS Assignment (10pts)

## Add to your chat server the ability to respond to several administrative commands.
### Enhance your server to be able to handle the following commands from clients.
---
- [ ] In all cases you should log the result to server.log.
- [ ] **/help**
   - [ ] Sends a list of available commands and their descriptions/usage
- [ ] **/clientlist**
   - [ ] Sends a list of all connected client names to the requesting client.
- [ ] **/username**
   - [ ] Updates the username of the client that sent the command.
   - [ ] For example, if Guest2 sends ‘/username John’ then Guest2’s username should be updated to ‘John’.
   - [ ] Handle Error Conditions. Your server should send an informative error message if the command fails for any reason.
     - [ ] Incorrect number of inputs
     - [ ] Username already in use
     - [ ] The new username is the same as the old username
   - [ ] If there is no error then
     - [ ] a message should be broadcast to all users informing them of the name change.
     - [ ]  Send a specialized message to the originating user informing them that the name change was successful.
  - [ ] **/w**
    - [ ] Sends a whisper (private, direct message) to another connected client.
    - For example: **/w Guest3 Hi** Should send the message 'Hi' to Guest3 only.
   - [ ] Handle Error Conditions. Your server should send an informative error message if the command fails for any reason.
     - [ ] incorrect number of inputs
     - [ ] invalid username
     - [ ] trying to whisper themselves
   - [ ] If there is no error then
     - [ ] a private message containing
       - [ ] the whisper sender’s name
       - [ ] the whispered message
     - [ ]  should be sent to the indicated user
 - [ ] **/kick** Kicks another connected client off the chat server, as long as the supplied admin password is correct.
- You can just store an adminPassword variable in memory on your server for now.
- For example ‘/kick Guest3 supersecretpw’ should kick Guest3 from the chat server
  - [ ] Your server should send an informative error message if the command fails for any reason
    - [ ] incorrect number of inputs
    - [ ] incorrect admin password
    - [ ] trying to kick themselves
    - [ ] invalid username to kick
  - [ ] If there is no error then
    - [ ] a private message should be sent to the kicked user informing them that they have been kicked from the chat.
They should then be removed from the server
    - [ ] A message should be broadcast to all other users informing them that the kicked user left the chat.

Submission:
Create a private repository.
Upload your Git Hub link.
Share your private repository with Curtis Dalton and Thomas Chan.
