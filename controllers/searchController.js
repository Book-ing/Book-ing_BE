const MEETING = require('../schemas/meeting');
const MEETINGMEMBER = require('../schemas/meetingMember');
const CODE = require('../schemas/codes');

/**
 * 2022. 05. 06. HSYOO.
 * TODO:
 *  1.
 * FIXME:
 *  1.
 */
async function getSelectSearchMeeting(req, res) {
    let location = '';
    let keyword = '';
    let category = '';

    !req.query.location ? (location = '') : (location = req.query.location);
    !req.query.keyword ? (keyword = '') : (keyword = req.query.keyword);
    !req.query.category ? (category = '') : (category = req.query.category);

    /**
     * location > 값이 없으면 '' 있으면 코드를 받음.
     * keyword > 값이 없으면 '' 있으면 문자열을 받음.
     * category > 값이 없으면 '' 있으면 1,2,3,4,5와 같이 문자열을 받음
     */

    let searchData = {};
    let resultData = {};

    const regex = (pattern) => {
        return new RegExp(`.*${pattern}.*`);
    };
    const keywordRegex = regex(keyword);

    const arrSearchMeetingList = await MEETING.find({
        meetingName: { $regex: keywordRegex },
    });

    searchData = arrSearchMeetingList;

    // 사용자가 선택한 지역을 검색한다.
    if (location !== '') {
        searchData = searchData.filter((val, i) => {
            if (String(val.meetingLocation) === String(location)) return true;
            else return false;
        });
    }

    // 사용자가 선택한 카테고리를 검색한다.
    if (category !== '') {
        const arrSplitCategory = category.split(',');
        searchData = searchData.filter((val, i) => {
            for (let ii = 0; ii < arrSplitCategory.length; ii++) {
                if (
                    String(val.meetingCategory) === String(arrSplitCategory[ii])
                )
                    return true;
            }
            return false;
        });
    }

    // 검색을 끝냈으나, 검색한 결과가 없다면 빈 오브젝트를 생성하여 내려준다.
    if (searchData.length === 0) {
        resultData.searchResult = {};
        return res.json({
            result: true,
            message: '검색 성공',
            data: resultData,
        });
    }

    // 검색이 끝난 결과데이터를 최종정리한다.
    // meetingId: 모임아이디
    // meetingName: [지역명]모임이름(가입인원수/최대가입가능수)
    // meetingIntro: 모임소개
    // meetingCategory: 모임카테고리

    // 미팅 별 가입자 수
    const meetingByJoindedCnt = await MEETINGMEMBER.aggregate([
        { $group: { _id: '$meetingId', count: { $sum: 1 } } },
    ]);

    // 지역 코드 조회
    const codeByLotationName = await CODE.find({ groupId: 1 });
    // 카테고리 코드 조회
    const codeByCategoryName = await CODE.find({ groupId: 2 });

    resultData.searchResult = searchData.map((val, i) => {
        const joinedCnt = meetingByJoindedCnt.find((element) => {
            if (element._id === val.meetingId) return true;
        });

        const locationName = codeByLotationName.find((element) => {
            if (String(element.codeId) === String(val.meetingLocation))
                return true;
        });
        console.log('locationName', locationName);

        const CategoryName = codeByCategoryName.find((element) => {
            if (String(element.codeId) === String(val.meetingCategory))
                return true;
        });
        console.log('CategoryName', CategoryName);

        return {
            meetingId: val.meetingId,
            meetingName: val.meetingName,
            meetingIntro: val.meetingIntro,
            meetingJoinedCnt:
                '(' + joinedCnt.count + '/' + val.meetingLimitCnt + ')',
            meetingLocation: locationName.codeValue,
            meetingCategory: CategoryName.codeValue,
        };
    });

    res.json({ result: true, message: '검색 성공', data: resultData });
}

module.exports = {
    getSelectSearchMeeting,
};
