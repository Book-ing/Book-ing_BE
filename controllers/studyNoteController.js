
//스터디 노트 작성
async function postNote(req, res) {
    // const { userId } = res.locals
    const { userId } = req.query;//임시 로그인 유저

    const { studyId, studyNote } = req.body;

}










module.exports = { postNote };
