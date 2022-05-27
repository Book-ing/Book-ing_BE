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

//방 배열 (studyId)
let roomObjArr = [];
let mediaStatus = {}
const MAXIMUM = 10;

io.on('connection', (socket) => {
    console.log('socketId : ', socket.id);
    socket.on('disconnect', () => {
        console.log('disconnect socketId : ', socket.id);
    });
    let myRoom = null;

    socket.on('joinMeetingRoom', async (meetingId, userId) => {
        if (!meetingId || !userId) return;
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

    let myRoomName = null
    let myNickname = null

    // roomName===studyId, nickname===userId
    socket.on('joinRoom', async (studyId, nickname, videoType) => {

        myRoomName = studyId
        myNickname = nickname
        myRoom = studyId;
        console.log('joinRoom', 'studyId :', studyId, 'nickname:', nickname);
        console.log('비디오 타입 넘어오니?', videoType)

        let isRoomExist = false
        let targetRoomObj = null

        //만약 
        if (!mediaStatus[studyId]) {
            mediaStatus[studyId] = {}
        }


        for (let i = 0; i < roomObjArr.length; i++) {

            // 스터디 룸 
            if (roomObjArr[i].studyId === studyId) {
                // 정원 초과
                if (roomObjArr[i].currentNum >= MAXIMUM) {
                    //정원 초과라 거부 이벤트 실행 
                    socket.emit('rejectJoin')
                    return
                }
                // 스터디 멤버 체크 
                // const joinedMemeber = await STUDYMEMBERS.findOne({ studyId })
                // if (username !== joinedMemeber.studyMemberId) {
                //     socket.emit('rejectUnvalidUser')
                //     return
                // }

                //정원 초과 아니면 해당 스터디 룸에 참여 
                isRoomExist = true
                //맞는 룸에 들어감 
                targetRoomObj = roomObjArr[i]
                break
            }
        }

        // 입력한 룸이름이 없다면 새로운 방 만듦 
        // 방이 존재하지 않는다면 방을 생성

        if (!isRoomExist) {
            targetRoomObj = {
                studyId,
                currentNum: 0,
                users: [],
            }
            roomObjArr.push(targetRoomObj)
        }

        console.log('joinRoom', 'targetRoomObj : ', targetRoomObj);
        // 어떠한 경우든 방에 참여
        targetRoomObj.users.push({
            socketId: socket.id,
            nickname,
        })
        targetRoomObj.currentNum++
        // 입력한 방에 입장 
        console.log(
            `${nickname}이 방 ${studyId}에 입장 (${targetRoomObj.currentNum}/${MAXIMUM})`
        )

        mediaStatus[studyId][socket.id] = {
            screensaver: false,
            muted: false,
        }
        // 입장 
        socket.join(studyId)
        //방에 참가하는 거 수락  3. 
        //입장할 때 socket.id 같이 보냄 
        socket.emit('joinStudyRoom', targetRoomObj.users, socket.id, videoType)
        socket.emit('checkCurStatus', mediaStatus[studyId])
    })


    socket.on('ice', (ice, remoteSocketId) => {
        console.log('ice 이벤트', 'ice : ', ice, 'remoteSocketId', remoteSocketId)
        socket.to(remoteSocketId).emit('ice', ice, socket.id)
    })

    socket.on('offer', (offer, remoteSocketId, localNickname) => {
        console.log('offer 이벤트', 'offer : ', offer, 'remoteSocketId', remoteSocketId, 'localNickname : ', localNickname)
        socket.to(remoteSocketId).emit('offer', offer, socket.id, localNickname)
    })
    // 다른 브라우저에서 보낸 answer 받음 =>5. 
    socket.on('answer', (answer, remoteSocketId) => {
        // 받은 answer  
        console.log('answer 이벤트', 'answer : ', answer, 'remoteSocketId', remoteSocketId)
        socket.to(remoteSocketId).emit('answer', answer, socket.id)
    })

    //방에 나갔을 때 
    socket.on('disconnecting', async () => {
        console.log('disconnecting')
        socket.to(myRoom).emit('leave_room', socket.id)
        console.log('disconnecting', 'myRoom : ', myRoom, 'socket.id : ', socket.id);
        for (let i = 0; i < roomObjArr.length; i++) {
            if (roomObjArr[i].studyId === myRoom) {
                const newUsers = roomObjArr[i].users.filter(
                    (user) => user.socketId !== socket.id
                )
                roomObjArr[i].users = newUsers
                roomObjArr[i].currentNum--;
                break;
            }
        }
        console.log("룸에 나간 이후", roomObjArr)
    })



    socket.on('leaveMeetingRoom', (meetingId, userId) => {
        socket.leave('meeting', meetingId);
        console.log(`${userId} leave a ${meetingId} Room`);
    });

    socket.on('chat message', async (meetingId, userId, message) => {
        if (!meetingId || !userId) return;
        try {
            console.log(
                'meetingId: ',
                meetingId,
                ' userId : ',
                userId,
                ' message : ',
                message,
            );
            const existMember = await MEETINGMEMBER.findOne({
                meetingId,
                meetingMemberId: userId,
            });
            if (existMember) {
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
            }
        } catch (error) {
            console.log(error);
        }
    });
});

module.exports = { server };