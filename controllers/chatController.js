const CHAT = require("../schemas/chats");
const MEETINGMEMBER = require('../schemas/meetingMember');
const USER = require('../schemas/user');

async function getChat(req, res) {
    const { meetingId } = req.params;
    const { userId } = res.locals.user;

    try {
        const existMeetingMember = await MEETINGMEMBER.findOne({
            meetingMemberId: userId,
            meetingId,
        });
        if (!existMeetingMember) {
            return res.status(403).json({ result: false, message: '모임 가입 멤버만 채팅 목록 조회 가능' });
        }

        const chats = await CHAT.find({ meetingId })
                                   .limit(50)
                                   .sort({ chatId: -1 })
                                   .then(result => result.sort((a, b) => a.chatId - b.chatId));
        const chatsUserId = chats.map(result => result.userId);
        const usersProfile = await USER.find({ userId: chatsUserId });

        const chatList = [];
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
                    chatList.push({
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

        res.status(200).json({ result: true, message: '모임 채팅 조회 성공', chatList });
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: false, message: '모임 채팅 조회 실패' });
    }
}

module.exports = {
    getChat,
};
