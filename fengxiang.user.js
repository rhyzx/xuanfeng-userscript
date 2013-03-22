// ==UserScript==
// @name        FengXiangEx
// @namespace   http://fenxiang.qq.com
// @version     0.1.0
// @description QQ分享下载地址导出
// @include     http://fenxiang.qq.com*
// @copyright   2013+, maplebeats/rhyzx
// ==/UserScript==


injectScript(function () {
// ======
var $ = window.jQuery // v1.7.2
  , msg     = window.XF.widget.msgbox


$('#btn_high').off('click').on('click', function () {
    msg.show('获取下载地址中...', 0, 5000)

    var tasks = $('.file_list_checkbox:checked').map(function (i, v) {
        var $e = $(this).parentsUntil('tr').last().parent().find('.share_fileneme')
        
        return {
            filename : $e.attr('title')
          , filehash : $e.attr('filehash')
        }
    })

    requestDownloadLinks(tasks, function (dls) {
        msg.hide()
        g_pop_export.setDownloads(dls)
        g_pop_export.show()
    })
})

function requestDownloadLinks(tasks, callback) {
    var count = 0
      , downloads = []

    
    $.each(tasks, function (i, task) {
        count++
        $.post(API_URL.handler_url +'/getComUrl', {
            filename : task.filename
          , filehash : task.filehash
        }, null, 'json')
        .done(function (res) {
            count--
            if (res && res.ret === 0) {
                downloads.push({
                    url         : res.data.com_url
                  , cookie      : res.data.com_cookie
                  , filename    : task.filename
                })
            }
        })
        .fail(function () {
            msg.show('获取失败', 2, 2000)
        })
        .always(function () {
            if (count === 0) {
                // sort according to filename
                downloads.sort(function (a, b) {
                    return a.filename.localeCompare(b.filename)
                })
                callback(downloads)
            }
        })
    })
}
/// =====
})


/**
 * download dialogBox
 * original code from xuanfeng.user.js
 */
injectScript(function () {
// ======

var $       = window.jQuery
  , xfDialog= window.xfDialog

var $export = $((function () {/*
<div id="ex_pop_export_dl" class="com_win">
    <div class="com_win_head_wrap"> <h1><em>导出下载</em> <span class="close_win" title="关闭"><a href="javascript:;"></a></span></h1></div>
    <div class="com_win_cont_wrap">
        <div class="com_win_cont">
        <div class="pop">
            <p class="ex_file">
                <a class="icon_file ex_file_aria" href="javascript:;" target="_blank"
                    title="$ aria2c -i aria2.down.txt"
                    download="aria2.down.txt"
                >存为aria2文件</a>
                <a class="icon_file ex_file_idm" href="javascript:;" target="_blank"
                    title="IDM"
                    download="idm.ef2"
                >存为IDM文件</a>
            </p>
            <div class="ex_code">
                <textarea readonly wrap="off"></textarea>
            </div>
        </div>
        </div>
    </div>
    <div class="com_win_foot_wrap"><div class="com_win_foot"></div></div>
</div>
*/}).toString().slice(16, -4)).appendTo('body')


var $file = $export.find('.ex_file_aria')
  , $code = $export.find('.ex_code textarea:first')

  , $idm  = $export.find('.ex_file_idm')

// setup dialog function
var pop = window.g_pop_export = new xfDialog('ex_pop_export_dl')

pop.setDownloads = function (dls) {
    var file = '', code = '', idm = ''

    for (var i=0, dl; dl=dls[i++];) {
        file += [
            dl.url
          , '  header=Cookie: FTN5K=' +dl.cookie
          , '  out=' +dl.filename
          , '  continue=true'
          , '  max-connection-per-server=10'
          , '  split=10'
          , '\n'
        ].join('\n')

        code += [
            'aria2c -c -s10 -x10 -o '
          , dl.filename
          , ' --header '
          , 'Cookie: FTN5K=' +dl.cookie
          , ' ' 
          , dl.url
          , '\n'
        ].join('\'')

        idm += [
            '<'
          , dl.url //+dl.filename?
          , 'cookie: FTN5K=' +dl.cookie
          , '>'
          , ''
        ].join('\r\n')
    }

    $file.attr('href', 'data:text/plain;charset=utf-8,' +encodeURIComponent(file))
    $code.val(code)

    $idm.attr('href', 'data:text/plain;charset=utf-8,' +encodeURIComponent(idm))
}

/// =====
})


/**
 * dialog overlay
 */
injectScript(function () {
// ======

var $overlay = $((function () {/*
<div class="overlay"></div>
*/}).toString().slice(16, -4)).appendTo('body')

g_pop_export.my_overlay_div = $overlay // set overlay for export dialog
/// =====
})

/**
 * overwrite CSS
 */
injectStyle((function () {/*
#ex_pop_export_dl {
    position: absolute;
    top: 200px;
    left: 50%;
    width: 640px;
    margin-left: -320px;
    text-align: left;
    color: #2d5b7c;
    z-index: 102;
    background: #FFF;
    overflow: hidden;
}
.ex_file {
    padding: 8px;
}
.ex_file a {
    color: #2d5b7c;
    display: inline-block;
    margin-right: 14px;
    outline: none;
}
.ex_code {
    margin: 0 8px;
    border: 1px solid #C7E2F1;
    border-raduis: 4px;
}
.ex_code textarea {
    width: 100%;
    height: 180px;
    font: 12px/1.5 monospace;
    border: none;
}



.icon_file{background:url(http://tr1.gtimg.com/lixian/images/filetype.gif) no-repeat left -48px; padding-left:20px; height:16px; line-height:16px; display:block; font-style:normal}

.com_win{overflow:hidden;zoom:1; position:absolute; text-align:left; color:#2d5b7c; font-size:12px; z-index:101;top:120px; left:140px; left:50%; display:none}
.com_win .com_win_head_wrap{ height:31px; background:url(http://tr1.gtimg.com/lixian/images/win_main.png) no-repeat right -32px; padding-right:5px;position:relative}
.com_win .com_win_head_wrap h1{ height:31px; background:url(http://tr1.gtimg.com/lixian/images/win_main.png) no-repeat left top;}
.com_win .com_win_head_wrap h1 em{height:31px; line-height:31px; font-size:14px; font-weight:bold; padding-left:8px; color:#FFF; display:block; font-style:normal}
.com_win .com_win_head_wrap h1 .close_win a{background:url(http://tr1.gtimg.com/lixian/images/win_main.png) no-repeat left -64px; display:block; position:absolute; right:0; top:0; font-size:12px; cursor:pointer; width:38px; height:31px}
.com_win .com_win_head_wrap h1 .close_win a:hover{ background:url(http://tr1.gtimg.com/lixian/images/win_main.png) no-repeat left -96px; display:block; position:absolute; right:0; top:0; font-size:12px; cursor:pointer; width:38px; height:31px}
.com_win .com_win_cont_wrap{ background:url(http://tr1.gtimg.com/lixian/images/win_right.png) repeat-y right top;padding-right:1px}
.com_win .com_win_cont_wrap .com_win_cont{ background:url(http://tr1.gtimg.com/lixian/images/win_left.png) repeat-y left top; padding-left:1px}
.com_win .com_win_foot_wrap{ background:url(http://tr1.gtimg.com/lixian/images/win_main.png) no-repeat right -140px; height:12px;padding-right:5px}
.com_win .com_win_foot_wrap .com_win_foot{ background:url(http://tr1.gtimg.com/lixian/images/win_main.png) no-repeat left -128px; height:12px}
.share_overlay{background: none repeat scroll 0 0 #DDDDDD;height: 100%;width: 100%;top:0;left:0;background-color:#fff;filter:alpha(opacity=75);opacity: 0.75;position:absolute;zoom:1;display:none}


.com_btn{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat right -138px;padding-right:5px; display:inline-block; margin:7px 5px 0 0;float:left;cursor:pointer;position:relative}
.com_btn span{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat left -104px; height:26px; display:inline-block;   padding: 8px 19px 0 20px; }
.com_btn span em{ background-image:url(http://tr1.gtimg.com/lixian/images/icon_opt.png); background-repeat:no-repeat;font-style:normal; font-weight:bold; height:18px; line-height:18px; display:inline-block; color:#1274AC}
.com_btn:hover{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat right -206px;padding-right:5px; height:34px; display:inline-block;text-decoration:none}
.com_btn:hover span{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat left -172px; height:26px; display:inline-block;   padding: 8px 19px 0 20px;}
.com_btn_hover{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat right -206px;padding-right:5px; height:34px; display:inline-block;text-decoration:none}
.com_btn_hover span{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat left -172px; height:26px; display:inline-block;   padding: 8px 19px 0 20px;}

.disabled_btn{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat right -138px;padding-right:5px;display:inline-block; cursor: default; }
.disabled_btn span{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat left -104px; height:26px; display:inline-block;   padding: 8px 19px 0 20px;}
.disabled_btn span em{color:#9ABFCE}
.disabled_btn:hover{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat right -138px;padding-right:5px; height:34px; display:inline-block}
.disabled_btn:hover span{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat left -104px; height:26px; display:inline-block;   padding: 8px 19px 0 20px;}

.com_opt_btn{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat right -26px;padding-right:5px; display:inline-block; margin:2px 5px 0 0;float:left;cursor:pointer;position:relative}
.com_opt_btn span{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat left 0; height:21px; display:inline-block;   padding: 5px 19px 0 20px; }
.com_opt_btn span em{font-style:normal; font-weight:bold; height:18px; line-height:18px; display:inline-block; color:#1274AC}
.com_opt_btn:hover{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat right -78px;padding-right:5px; height:26px; display:inline-block;text-decoration:none}
.com_opt_btn:hover span{background:url(http://tr1.gtimg.com/lixian/images/com_btn.png) no-repeat left -52px; height:21px; display:inline-block;   padding: 5px 19px 0 20px;}


.com_btn span em.btn_download{background-position:0 0; padding-left:25px;}
.disabled_btn span em.btn_download{background-position:0 -18px;  padding-left:25px;}

.com_btn span em.btn_share{background-position:0 -108px; padding-left:25px;}
.disabled_btn span em.btn_share{background-position:0 -126px;  padding-left:25px;}

.com_btn span em.btn_new{background-position:0 -72px; padding-left:25px;}
.disabled_btn span em.btn_new{background-position:0 -90pxpx;  padding-left:25px;}

.com_btn span em.btn_bt{background-position:0 -1000px; padding-left:0px;}
.disabled_btn span em.btn_bt{background-position:0 -1000px; padding-left:0px;}

.com_btn span em.btn_del{background-position:0 -36px; padding-left:25px;}
.disabled_btn span em.btn_del{background-position:0 -54px;  padding-left:25px;}


.com_loading{background:url(http://tr1.gtimg.com/lixian/images/loading.gif) no-repeat left top; padding-left:20px; font-style:normal}

.overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    display: none;
    z-index: 100;
    background-color: #fff;
    opacity: 0.75;
}
*/}).toString().slice(16, -4)) // extract css in function


// execute code in the content page scope
function injectScript(source) {
    var script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.textContent = ';(' + source.toString() + ')()'

    document.body.appendChild(script)
    document.body.removeChild(script)
}

// insert css
function injectStyle(css) {
    var script = document.createElement('style')
    script.setAttribute('type', 'text/css')
    script.textContent = css
    document.head.appendChild(script)
}
