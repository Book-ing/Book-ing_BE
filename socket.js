const app = require('./app');
const http = require('http');
const https = require('https');
const USER = require('./schemas/user');
const MEETINGMEMBER = require('./schemas/meetingMember');
const CHAT = require('./schemas/chats');
const lib = require('./lib/util');
const credentials = require('./config/httpsConfig');

let server = '';
if (process.env.PORT) {
    server = https.createServer(credentials, app);
} else {
    server = http.createServer(app);
}
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        credentials: true,
    },
});

io.on('connection', (socket) => {
    console.log('socketId : ', socket.id);
    socket.on('disconnect', () => {
        console.log('disconnect socketId : ', socket.id);
    });

    socket.on('joinMeetingRoom', async (meetingId, userId) => {
        try {
            const existMember = await MEETINGMEMBER.findOne({
                meetingId,
                meetingMemberId: userId,
            });
            if (existMember) {
                socket.join('meeting', meetingId);
                io.to('meeting', meetingId).emit('joinMeetingRoom', userId);
                console.log(`${userId} join a ${meetingId} Room`);
            }
        } catch (error) {
            console.log(error);
        }
    });

    socket.on('leaveMeetingRoom', (meetingId, userId) => {
        console.log(`${userId} leave a ${meetingId} Room`);
        socket.leave(meetingId, () => {
            io.to(meetingId).emit('leaveMeeting', userId);
        });
    });

    socket.on('chat message', async (meetingId, userId, message) => {
        try {
            console.log(
                'meetingId: ',
                meetingId,
                ' userId : ',
                userId,
                ' message : ',
                message
            );
            const userProfile = await USER.findOne({ userId });
            const chatMessage = {
                userId,
                username: userProfile.username,
                profileImage: userProfile.profileImage,
                message,
                regDate: lib.getDate(),
            };
            io.to('meeting', meetingId).emit('chat message', chatMessage);
            await CHAT.create({
                meetingId,
                userId,
                message,
                regDate: lib.getDate(),
            });
        } catch (error) {
            console.log(error);
        }
    });
});

module.exports = { server };
