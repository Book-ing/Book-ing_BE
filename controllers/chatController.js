const CHAT = require("../schemas/chats");

async function getChat(req, res) {
    const { meetingId } = req.params;
    // const { userId } = res.locals.user;

    try {

        const chatList = await CHAT.find({ meetingId }).sort({ chatId: 1 });
        console.log(chatList);

        res.status(201).json({ result: true, message: '모임 채팅 조회 성공' });
    } catch (error) {
        console.log(error);
        res.status(400).json({ result: false, message: '모임 채팅 조회 성공' });
    }
}

module.exports = {
    getChat
};