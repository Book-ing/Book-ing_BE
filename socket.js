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
        const existMember = await MEETINGMEMBER.findOne({
            meetingId,
            meetingMemberId: userId,
        });
        if (existMember) {
            socket.join('meeting', meetingId);
            const chats = await CHAT.find({ meetingId })
                .limit(50)
                .sort({ chatId: -1 })
                .then(result => result.sort((a, b) => a.chatId - b.chatId));
            const chatsUserId = chats.map(result => result.userId);
            const usersProfile = await USER.find({ userId: chatsUserId });

            const Messages = [];
            for (let i = 0; i < chats.length; i++) {
                const meetingId = chats[i].meetingId;
                const userId = chats[i].userId;
                const message = chats[i].message;
                const regDate = chats[i].regDate;
                const chatId = chats[i].chatId;
                for (let j = 0; j < usersProfile.length; j++) {
                    const username = usersProfile[j].username;
                    const profileImage = usersProfile[j].profileImage;
                    if (usersProfile[j].userId === userId) {
                        Messages.push({
                            meetingId,
                            chatId,
                            message,
                            regDate,
                            userId,
                            username,
                            profileImage,
                        });
                    }
                }
            }
            io.to('meeting', meetingId).emit('getMessages', Messages); // db에 저장된 메세지를 보내준다.
            console.log(`${userId} join a ${meetingId} Room`);
        }
    });

    socket.on('leaveMeetingRoom', (meetingId, userId) => {
        socket.leave('meeting', meetingId);
        console.log(`${userId} leave a ${meetingId} Room`);
    });

    socket.on('chat message', async (meetingId, userId, message) => {
        try {
            console.log(
                'meetingId: ',
                meetingId,
                ' userId : ',
                userId,
                ' message : ',
                message,
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
