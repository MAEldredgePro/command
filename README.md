# Project 'command': Chat server enhancements - NodeJS Assignment (10pts)

## Add to your chat server the ability to respond to several administrative commands.
### Enhance your server to be able to handle the following commands from clients.
---
- [x] **/help**
   - [x] Sends a list of available commands and their descriptions/usage
   - [x] log the result to server.log.
- [x] **/clientlist**
   - [x] Sends a list of all connected client names to the requesting client.
   - [x] log the result to server.log.
- [x] **/username**
   - [x] Updates the username of the client that sent the command.
   - [x] For example, if Guest2 sends ‘/username John’ then Guest2’s username should be updated to ‘John’.
   - [x] Handle Error Conditions. Your server should send an informative error message if the command fails for any reason.
     - [x] Incorrect number of inputs
     - [x] Username already in use
     - [x] The new username is the same as the old username
   - [x] If there is no error then
     - [x] a message should be broadcast to all users informing them of the name change.
     - [x]  Send a specialized message to the originating user informing them that the name change was successful.
     - [x]  log the result to server.log.
- [x] **/w**
   - [x] Sends a whisper (private, direct message) to another connected client.
   - For example: **/w Guest3 Hi** Should send the message 'Hi' to Guest3 only.
   - [x] Handle Error Conditions. Your server should send an informative error message if the command fails for any reason.
     - [x] incorrect number of inputs
     - [x] invalid username
     - [x] trying to whisper themselves
   - [x] If there is no error then a private message containing the sender’s name and the whispered message should be sent to the indicated user
   - [x] log the result to server.log.
 - [x] **/kick**
    - [x] Kicks another connected client off the chat server, as long as the supplied admin password is correct.
    - You can just store an adminPassword variable in memory on your server for now.
    - For example ‘/kick Guest3 supersecretpw’ should kick Guest3 from the chat server
    - [x] Your server should send an informative error message if the command fails for any reason
      - [x] incorrect number of inputs
      - [x] incorrect admin password
      - [x] trying to kick themselves
      - [x] invalid username to kick
    - [x] If there is no error then a private message should be sent to the kicked user informing them that they have been kicked from the chat.
    - [x] They should then be removed from the server
    - [x] Broadcast a message to all other users informing them that the kicked user has left the chat.
    - [x] log the result to server.log.

Submission:
Create a private repository.
Upload your Git Hub link.
Share your private repository with Curtis Dalton (ctdalton) and Thomas Chan (chan-thomas).
