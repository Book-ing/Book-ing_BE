const STUDY = require('../schemas/studys');
const STUDYMEMBERS = require('../schemas/studyMembers');
const MEETING = require('../schemas/meeting');
const { getDate } = require('../lib/util');
const moment = require('moment')

//π‘
//μ€ν°λ λΈνΈ μμ±

/**===================================================================
 * 1. μ€ν°λ λΈνΈ μμ±ν  λ ν΄λΉ μ€ν°λ μ ν¨νμ§ μ²΄ν¬
 * 2. μ μ κ° μ ν¨νμ§ μ²΄ν¬ 
 * 3. μ€ν°λ λ°μ μ(μ₯)κ³Ό λͺ¨μμ₯λ§ λΈνΈ μμ±κ°λ₯νμ§ μ²΄ν¬
 ===================================================================*/
async function postNote(req, res, next) {
    /*================================================
        #swagger.tags = ['STUDYNOTE']
        #swagger.summary = 'μ€ν°λ λΈνΈ μμ±  API'
        #swagger.description = 'μ€ν°λ λΈνΈ μμ±  API'
    ==================================================*/
    const { userId } = res.locals.user;
    const { studyId, studyNote } = req.body;

    // studyStatus a == μ€ν°λ μΌμ μ , b== μ€ν°λ μμ ν 24μκ° μ΄λ΄ c == μμλΆν° 24μκ° ν 
    try {
        let validStudy = await STUDY.findOne({ studyId });
        if (!validStudy) {
            return next(new Error('ν΄λΉ μ€ν°λκ° μ‘΄μ¬νμ§ μμ΅λλ€'));
        }


        let rightNow = getDate();

        // if (validStudy.studyDateTime > rightNow) {
        //     return res.status(400).json({
        //         result: false,
        //         message: 'μ€ν°λ μ μ΄λΌ λΈνΈ μμ±μ΄ λΆκ°ν©λλ€'
        //     })
        // }

        //λ§μ½ μ€λ λ μ§κ° μ€ν°λ μΌμλ³΄λ€ νλ£¨κ° λ¦μΌλ©΄ λΈνΈ μμ± λΆκ°
        let studyTime = moment(validStudy.studyDateTime, 'YYYY-MM-DD HH:mm:ss')


        if (moment.duration(studyTime.diff(rightNow)).asHours() <= -24) {
            return next(new Error('μ€ν°λ λΈνΈ μμ±μ μ€ν°λ μμ μ΄ν 24μκ°μ΄ μ§λλ©΄ μμ±μ΄ λΆκ°λ₯ν©λλ€.'));
        }

        //μ€ν°λ λΈνΈ μμ± κ°λ₯ν μ
        let editMaster = [];
        //λ°μ μ€ν°λ μμ΄λμ λ©€λ²λ€ μ°Ύμ
        let validStudyMembers = [];
        let studyMembers = await STUDYMEMBERS.find({ studyId });
        for (let i = 0; i < studyMembers.length; i++) {
            validStudyMembers.push(studyMembers[i].studyMemberId);
        }


        //λ°μ μ€ν°λμ λͺ¨μ μ°Ύμ
        if (!validStudyMembers.includes(Number(userId))) {
            return next(new Error('ν΄λΉ μ€ν°λ μ°Έμ¬ λ©€λ²κ° μλλλ€'));
        }
        let targetMeeting = await MEETING.findOne({
            meetingId: validStudy.meetingId,
        });
        //μ°Ύμ λͺ¨μμ λͺ¨μμ₯ μ°Ύμ
        let targetMeetingMasterId = targetMeeting.meetingMasterId;
        //μ€ν°λ λΈνΈ μμ± κ°λ₯ν μ λ£μ΄μ€(μ€ν°λμ₯(λ°μ μ), λͺ¨μμ₯)
        editMaster.push(targetMeetingMasterId);
        for (let i = 0; i < studyMembers.length; i++) {
            if (studyMembers[i].isStudyMaster) {
                editMaster.push(studyMembers[i].studyMemberId);
            }
            // studyMemberId.push(studyMembers[i].)
        }
        if (editMaster.includes(Number(userId))) {
            await STUDY.updateOne({ studyId }, { $set: { studyNote } });

            /*=====================================================================================
               #swagger.responses[201] = {
                   description: 'μ€ν°λ λΈνΈ μμ± μλ£νλ©΄ μ΄ μλ΅μ μ€λ€.',
                   schema: { "result": true, 'message':'μ€ν°λ λΈνΈ μμ± μλ£', }
               }
               =====================================================================================*/
            return res
                .status(201)
                .json({ result: true, message: 'μ€ν°λ λΈνΈ μμ± μλ£!' });
        } else {
            return next(new Error('μ€ν°λ λΈνΈ μμ±μ λ°μ μμ λͺ¨μμ₯λ§ κ°λ₯ν©λλ€.'));
        }
    } catch (error) {
        /*=====================================================================================
           #swagger.responses[400] = {
               description: 'λͺ¨λ  μμΈμ²λ¦¬λ₯Ό λΉλκ° κ²½μ° μ΄ μλ΅μ μ€λ€.',
               schema: { "result": false, 'message':'μ€ν°λ λΈνΈ μμ± μ€ν¨', }
           }
           =====================================================================================*/
        return next({ message: 'μ€ν°λ λΈνΈ μμ± μ€ν¨', stack: error, code: 500 });
    }
}



//λΈνΈ μμ νκΈ°π‘
/**===================================================================
 * 1.μ€ν°λ λΈνΈ μμ ν  λ λ°μ μ€ν°λ μ ν¨νμ§ μ²΄ν¬
 * 2. λ‘κ·ΈμΈν μ μ  μ ν¨νμ§ μ²΄ν¬
 * 3. μ€ν°λμ₯(λ°μ μ)κ³Ό λͺ¨μμ₯λ§ μ€ν°λ λΈνΈ μμ  κ°λ₯ 
 ===================================================================*/
async function updateNote(req, res, next) {
    /*================================================
        #swagger.tags = ['STUDYNOTE']
        #swagger.summary = 'μ€ν°λ μμ  API'
        #swagger.description = 'μ€ν°λ μμ  API'
    ==================================================*/

    const { userId } = res.locals.user;
    const { studyId, studyNote } = req.body;

    try {
        const validStudy = await STUDY.findOne({ studyId });
        if (!validStudy) {
            return next(new Error('μ ν¨νμ§ μμ μ€ν°λ μλλ€.'));
        }

        //μ€ν°λλΈνΈλ₯Ό νΈμ§ν  μ μλ μ
        let editMaster = [];
        //μ€ν°λ λ°μ μλ₯Ό μ°Ύμ
        const targetStudy = await STUDY.findOne({ studyId });
        let targetMeeting = await MEETING.findOne({
            meetingId: targetStudy.meetingId,
        });
        //λͺ¨μμ₯ μ°Ύμ
        let targetMeetingMasterId = targetMeeting.meetingMasterId;
        let studyMembers = await STUDYMEMBERS.find({ studyId });
        //λͺ¨μμ₯μ ν λͺμ΄λ λ¨Όμ  λͺ¨μμ₯ λ£μ΄μ€
        editMaster.push(targetMeetingMasterId);
        //μ€ν°λ λ©€λ² μλ§νΌ λλ©΄μ μ€ν°λμ₯μ λ£μ΄μ€
        for (let i = 0; i < studyMembers.length; i++) {
            if (studyMembers[i].isStudyMaster) {
                editMaster.push(studyMembers[i].studyMemberId);
            }
        }
        if (editMaster.includes(Number(userId))) {
            await STUDY.updateOne({ studyId }, { $set: { studyNote } });

            /*=====================================================================================
               #swagger.responses[201] = {
                   description: 'μ€ν°λ μμ μ μλ£νλ©΄ μ΄ μλ΅μ μ€λ€.',
                   schema: { "result": true, 'message':'μ€ν°λ λΈνΈ μμ  μλ£!, }
               }
               =====================================================================================*/
            return res
                .status(201)
                .json({ result: true, message: 'μ€ν°λ λΈνΈ μμ  μλ£!' });
        } else {
            return next(new Error('μ€ν°λ λΈνΈ μμ μ λ°μ μμ λͺ¨μμ₯λ§ κ°λ₯ν©λλ€.'));
        }
    } catch (error) {
        /*=====================================================================================
           #swagger.responses[400] = {
               description: 'λͺ¨λ  μμΈμ²λ¦¬λ₯Ό λΉλκ° κ²½μ° μ΄ μλ΅μ μ€λ€.',
               schema: { "result": false, 'message':'μ€ν°λ λΈνΈ μμ  μ€ν¨', }
           }
           =====================================================================================*/
        return next({ message: 'μ€ν°λ λΈνΈ μμ  μ€ν¨', stack: error, code: 500 });
    }
}

module.exports = { postNote, updateNote };
