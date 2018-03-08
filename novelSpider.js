/**
 * 电子书章节列表爬虫
 * @author 刘双源
 * @date 20180308
 */

const https = require('https');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const BufferHelper = require('bufferhelper');
const readline = require('readline');

const searchUrl = 'https://www.88dus.com/search/so.php?q=';
const baseUrl = 'https://www.88dus.com';


/**
 * 启动爬虫
 */
var spider = function () {
    var rl = readline.createInterface(process.stdin, process.stdout);
    return function () {
        rl.resume();
        rl.question('input your book name:', function (answer) {
            console.log('book name is:' + answer);
            rl.pause();
            getBookIdWithName(answer);
        });
    }

}();


function again() {
    setTimeout(spider, 1000);
}

/*getBookIdWithName('斗破苍穹');*/

/**
 * 根据书名、作者名获取书籍Id
 * @param name
 */
function getBookIdWithName(name) {
    sendGetReq(searchUrl + encodeURIComponent(name), getBookId, 'UTF-8');

    function getBookId(result) {
        var $ = cheerio.load(result);
        var $ul = $('.ops_cover');
        if (0 !== $ul.find('.ops_no').length) {
            console.log('查询不到该书籍!');
            again();
            return;
        }
        // 书籍列表
        var booklist = $ul.find('.block'),
            bookParm = getMostSimilarBook(booklist, name);
        console.log('书名:' + bookParm[0]);
        findBookList(bookParm[1]);
    }

    /**
     * 获取最接近的书籍
     */
    function getMostSimilarBook(booklist, oriBookName) {
        var bookName = "", bookUrl;
        for (var i = 0; i < booklist.length; i++) {
            var $d = booklist.eq(i).find('h2>a'),
                _bookName = $d.text()
            _bookUrl = $d.attr('href');
            if (oriBookName === _bookName) {
                bookName = _bookName;
                bookUrl = _bookUrl;
                break;
            }
            else if (_bookName.length < (bookName.length || 99)) {
                bookName = _bookName;
                bookUrl = _bookUrl;
            }
        }
        return [bookName, bookUrl];
    }
}

/**
 * 获取章节列表
 * @param bookId
 */
function findBookList(bookId) {
    sendGetReq(baseUrl + bookId, matchList, 'GBK');

    function matchList(html) {
        var $ = cheerio.load(html);
        var $list = $('.mulu').find('a');
        console.log('书籍列表:')
        $list.each(function (i, a) {
            console.info($(a).text());
        });
        again();
    }
}

/**
 * 发送https get请求
 * @param url
 * @param callback
 * @param encoding
 */
function sendGetReq(url, callback, encoding) {
    https.get(url, function (req, res) {
        var bufferHelper = new BufferHelper();
        req.on('data', function (chunk) {
            bufferHelper.concat(chunk);
        });
        req.on('end', function () {
            var result = iconv.decode(bufferHelper.toBuffer(), encoding || 'UTF-8');
            callback(result);
        });
    });
}

console.log('base web on https://www.88dus.com')
// 启动爬虫
spider();
