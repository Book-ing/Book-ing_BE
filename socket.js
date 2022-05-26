const app = require('./app');
const http = require('http');
const https = require('https');
const USER = require('./schemas/user');
const STUDY = require('./schemas/studys');
const STUDYMEMBERS = require('./schemas/studyMembers');
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

//방 배열 (roomId)
let roomObjArr = [];
let mediaStatus = {};
const MAXIMUM = 10; //TODO 바꿔야됨

const roomNameCreator = (roomId, type) => {
    type = type === 'room' ? 'study' : 'meeting';
    return type + roomId;
};

async function findMember(type, roomId, userId) {
    let existMember;
    if (type === 'room') {
        console.log('스터디 타입을 탔어요');
        existMember = await STUDYMEMBERS.findOne({
            studyId: roomId,
            studyMemberId: userId,
        });
    } else if (type === 'crew') {
        console.log('모임 타입을 탔어요');
        existMember = await MEETINGMEMBER.findOne({
            meetingId: roomId,
            meetingMemberId: userId,
        });
    }
    return existMember;
}

io.on('connection', (socket) => {
    console.log('connection socketId : ', socket.id);
    let myRoom = null;
    // let myRoomName = null;
    let myNickname = null;

    // roomName===roomId, nickname===userId
    // type = room(study) or crew(meeting)
    socket.on('joinRoom', async (roomId, userId, type) => {
        console.log('roomId : ', roomId, ' userId : ', userId, ' type : ', type);
        // 공통적인 부분
        let existMember = await findMember(type, roomId, userId);
        if (!roomId || !userId || !existMember) return;

        const roomName = roomNameCreator(roomId, type);
        console.log('roomName : ', roomName);

        const user = await USER.findOne({ userId });
        const nickname = user.username;

        // Start of if
        // video
        if (type === 'room') {
            console.log('스터디에 들어와서 비디오 부분이 시작돼요');
            // myRoomName = roomId;
            myNickname = nickname;
            myRoom = roomId;
            console.log('joinRoom', 'roomId :', roomId, 'nickname:', nickname);

            let isRoomExist = false;
            let targetRoomObj = null;

            //만약
            if (!mediaStatus[roomId]) {
                mediaStatus[roomId] = {};
            }

            for (let i = 0; i < roomObjArr.length; i++) {

                // 스터디 룸
                if (roomObjArr[i].roomId === roomId) {
                    // 정원 초과
                    if (roomObjArr[i].currentNum >= MAXIMUM) {
                        //정원 초과라 거부 이벤트 실행
                        socket.emit('rejectJoin');
                        return;
                    }
                    // 스터디 멤버 체크
                    // const joinedMemeber = await STUDYMEMBERS.findOne({ studyId })
                    // if (username !== joinedMemeber.studyMemberId) {
                    //     socket.emit('rejectUnvalidUser')
                    //     return
                    // }

                    //정원 초과 아니면 해당 스터디 룸에 참여
                    isRoomExist = true;
                    //맞는 룸에 들어감
                    targetRoomObj = roomObjArr[i];
                    break;
                }
            }

            // 입력한 룸이름이 없다면 새로운 방 만듦
            // 방이 존재하지 않는다면 방을 생성

            if (!isRoomExist) {
                targetRoomObj = {
                    roomId,
                    currentNum: 0,
                    users: [],
                };
                roomObjArr.push(targetRoomObj);
            }

            console.log('joinRoom', 'targetRoomObj : ', targetRoomObj);
            // 어떠한 경우든 방에 참여
            targetRoomObj.users.push({
                socketId: socket.id,
                nickname,
            });
            targetRoomObj.currentNum++;
            // 입력한 방에 입장
            console.log(
                `${ nickname }이 방 ${ roomName }에 입장 (${ targetRoomObj.currentNum }/${ MAXIMUM })`,
            );

            mediaStatus[roomId][socket.id] = {
                screensaver: false,
                muted: false,
            };
            //방에 참가하는 거 수락  3.
            //입장할 때 socket.id 같이 보냄
            socket.emit('joinStudyRoom', targetRoomObj.users, socket.id);
            socket.emit('checkCurStatus', mediaStatus[roomId]);
        }
        // End of if

        const chats = await CHAT.find({ roomId: roomName })
                                .limit(50)
                                .sort({ chatId: -1 })
                                .then(result => result.sort((a, b) => a.chatId - b.chatId));
        const chatsUserId = chats.map(result => result.userId);
        const usersProfile = await USER.find({ userId: chatsUserId });

        const Messages = [];
        for (let i = 0; i < chats.length; i++) {
            const roomId = chats[i].roomId;
            const userId = chats[i].userId;
            const message = chats[i].message;
            const regDate = chats[i].regDate;
            const chatId = chats[i].chatId;
            for (let j = 0; j < usersProfile.length; j++) {
                const username = usersProfile[j].username;
                const profileImage = usersProfile[j].profileImage;
                if (usersProfile[j].userId === userId) {
                    Messages.push({
                        roomId,
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
        // 입장
        socket.join(roomName);
        io.to(roomName).emit('getMessages', Messages); // db에 저장된 메세지를 보내준다.
    });

    socket.on('ice', (ice, remoteSocketId) => {
        console.log('ice 이벤트', 'ice : ', ice, 'remoteSocketId', remoteSocketId);
        socket.to(remoteSocketId).emit('ice', ice, socket.id);
    });

    socket.on('offer', (offer, remoteSocketId, localNickname) => {
        console.log('offer 이벤트', 'offer : ', offer, 'remoteSocketId', remoteSocketId, 'localNickname : ', localNickname);
        socket.to(remoteSocketId).emit('offer', offer, socket.id, localNickname);
    });
    // 다른 브라우저에서 보낸 answer 받음 =>5. 
    socket.on('answer', (answer, remoteSocketId) => {
        // 받은 answer  
        console.log('answer 이벤트', 'answer : ', answer, 'remoteSocketId', remoteSocketId);
        socket.to(remoteSocketId).emit('answer', answer, socket.id);
    });

    //방에 나갔을 때 
    socket.on('disconnecting', async () => {
        socket.to(myRoom).emit('leave_room', socket.id);
        console.log('disconnecting', 'myRoom : ', myRoom, 'socket.id : ', socket.id);
        for (let i = 0; i < roomObjArr.length; i++) {
            if (roomObjArr[i].roomId === myRoom) {
                const newUsers = roomObjArr[i].users.filter(
                    (user) => user.socketId !== socket.id,
                );
                roomObjArr[i].users = newUsers;
                roomObjArr[i].currentNum--;
                break;
            }
        }
        console.log('룸에 나간 이후', roomObjArr);
    });

    socket.on('chat message', async (roomId, userId, message, type) => { //TODO type 받아야함
        console.log('roomId: ', roomId, ' userId : ', userId, ' message : ', message, ' type : ', type);
        let existMember = await findMember(type, roomId, userId);
        if (!roomId || !userId || !existMember) return;

        const roomName = roomNameCreator(roomId, type);
        console.log('roomName : ', roomName);

        const userProfile = await USER.findOne({ userId });
        const chatMessage = {
            userId,
            username: userProfile.username,
            profileImage: userProfile.profileImage,
            message,
            regDate: lib.getDate(),
        };
        await CHAT.create({
            roomId: roomName,
            userId,
            message,
            regDate: lib.getDate(),
        });
        io.to(roomName).emit('chat message', chatMessage);
    });
});

module.exports = { server };
