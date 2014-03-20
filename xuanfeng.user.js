// ==UserScript==
// @name       XuanFengEx
// @namespace  https://github.com/rhyzx/xuanfeng-userscript
// @version    0.7.2
// @description  QQ旋风网页版离线下载增强
// @match      http://lixian.qq.com/main.html*
// @copyright  2013+, rhyzx
// ==/UserScript==


/**
 * export downloads
 */
injectScript(function () {
// ======

var $       = window.jQuery // v1.6.1
  , msg     = window.XF.widget.msgbox

// export / rewrite
$('#task_dl_local em').text('导出下载')
EventHandler.task_batch2local = function (e) {
    if ($(e).hasClass('disabled_btn')) return
    msg.show('获取下载地址中...', 0, 5000)
    
    requestDownloadLinks(function (dls) {
        msg.hide()
        g_pop_export.setDownloads(dls)
        g_pop_export.show()
    })
}



// get selected tasks' download link/cookie/filename
// callback(dowloads)
function requestDownloadLinks(callback) {
    var count = 0
      , downloads = []

    $.getJSON('/handler/lixian/get_lixian_status.php'/*, {mids : [ids]} NOUSE*/)
    .done(function (res) {
        $.each(res.data, function (i, task) {
            // check
            if (
                !$('#task_sel_' +task.mid).is(':checked')|| // user selected
                task.file_size !== task.comp_size        || // download finished
                task.dl_status !== TASK_STATUS['ST_UL_OK']
            ) return

            
            count++
            $.post('/handler/lixian/get_http_url.php', {
                hash    : task.hash
              , filename: task.file_name
              //, g_tk    : getACSRFToken(cookie.get('skey', 'qq.com'))
              //, browser : 'other'
            }, null, 'json')
            .done(function (res) {
                count--
                if (res && res.ret === 0) {
                    // break speed limit
                    // thanks @4023 https://userscripts.org/users/381599
                    var url = res.data.com_url
                        .replace('xflx.store.cd.qq.com:443', 'xfcd.ctfs.ftn.qq.com')
                        .replace('xflx.sz.ftn.qq.com:80', 'sz.disk.ftn.qq.com')
                        .replace('xflx.cd.ftn.qq.com:80', 'cd.ctfs.ftn.qq.com')
                        .replace('xflxsrc.store.qq.com:443', 'xfxa.ctfs.ftn.qq.com')

                    downloads.push({
                        url         : url
                      , cookie      : res.data.com_cookie
                      , filename    : task.file_name
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
    })
    .fail(function () {
        msg.show('获取列表的接口坏了嘛？！ 请联系脚本作者', 2, 2000)
    })
}
window.requestDownloadLinks = requestDownloadLinks // export to global

/// =====
})


/**
 * aria rpc
 */
injectScript(function recall() {
// ======

var $       = window.jQuery
  , msg     = window.XF.widget.msgbox


// button
var $export = $('#task_dl_local')
var $rpc = $export.clone()
            .removeAttr('onclick')
            .attr('id', 'task_dl_rpc')
            .find('em').text('RPC').end()
            .insertAfter($export)

// diable/enable botton
$(document).click(function () {
    $export.hasClass('disabled_btn') 
        ? $rpc.addClass('disabled_btn')
        : $rpc.removeClass('disabled_btn')
})


$rpc.click(function (evt) {
    if ($rpc.hasClass('disabled_btn')) return

    var config = {
        url : localStorage.getItem('rpc-url')
      , user: localStorage.getItem('rpc-user')
      , pass: localStorage.getItem('rpc-pass')
    }
    if (config.url) {
        msg.show('获取下载地址中...', 0, 5000)
        requestDownloadLinks(function (dls) {
            msg.show('rpc请求中...', 0, 5000)

            rpc(dls, config)
            .done(function () {
                msg.show('成功', 1, 2000)
            })
            .fail(function () {
                msg.show('rpc请求失败,请检查设置', 2, 2000)
                g_pop_rpc.showConfig(config)
            })
        })
    } else {
        msg.show('rpc未设置', 3, 2000)
        g_pop_rpc.showConfig() // default url
    }
})


function rpc(dls, config) {
    var data = []
    $.each(dls, function (k, dl) {
        data.push({
            jsonrpc : '2.0'
          , id      : 'down_' +k
          , method  : 'aria2.addUri'
          , params  : [
                [dl.url]
              , {
                    out     : dl.filename
                  , header  : 'Cookie: FTN5K=' +dl.cookie
                  , continue: 'true'
                  , split   : '10'
                  , 'max-connection-per-server' : '10'
                }
            ]
        })
    })

    
    // http authorization
    var beforeSend
    if (config.user) {
        if (typeof btoa !== 'function') return alert('你的浏览器不支持验证，请不要设置用户名和密码')
        beforeSend = function (xhr) {
            xhr.setRequestHeader(
              'Authorization',
              'Basic ' +btoa( config.user +':' +config.pass )
            )
        }
    }

    // return Deferred Obj
    return $.ajax(config.url, {
        data    : JSON.stringify(data)
      , type    : 'POST'
      , cache   : false
      , beforeSend : beforeSend
    })
}

/// =====
})


/**
 * auto login
 */
injectScript(function recall() {
// ======

// function from http://imgcache.qq.com/ptlogin/ver/10021/js/comm.js
var hexchar2bin=function(str){var arr=[];for(var i=0;i<str.length;i=i+2){arr.push("\\x"+str.substr(i,2))}arr=arr.join("");eval("var temp = '"+arr+"'");return temp}
var md5=function(){var r=1;var n="";var t=8;var a=32;function u(r){return e(r)}function e(r){return g(v(A(r),r.length*t))}function v(r,n){r[n>>5]|=128<<n%32;r[(n+64>>>9<<4)+14]=n;var t=1732584193;var u=-271733879;var e=-1732584194;var v=271733878;for(var i=0;i<r.length;i+=16){var s=t;var A=u;var g=e;var b=v;t=f(t,u,e,v,r[i+0],7,-680876936);v=f(v,t,u,e,r[i+1],12,-389564586);e=f(e,v,t,u,r[i+2],17,606105819);u=f(u,e,v,t,r[i+3],22,-1044525330);t=f(t,u,e,v,r[i+4],7,-176418897);v=f(v,t,u,e,r[i+5],12,1200080426);e=f(e,v,t,u,r[i+6],17,-1473231341);u=f(u,e,v,t,r[i+7],22,-45705983);t=f(t,u,e,v,r[i+8],7,1770035416);v=f(v,t,u,e,r[i+9],12,-1958414417);e=f(e,v,t,u,r[i+10],17,-42063);u=f(u,e,v,t,r[i+11],22,-1990404162);t=f(t,u,e,v,r[i+12],7,1804603682);v=f(v,t,u,e,r[i+13],12,-40341101);e=f(e,v,t,u,r[i+14],17,-1502002290);u=f(u,e,v,t,r[i+15],22,1236535329);t=o(t,u,e,v,r[i+1],5,-165796510);v=o(v,t,u,e,r[i+6],9,-1069501632);e=o(e,v,t,u,r[i+11],14,643717713);u=o(u,e,v,t,r[i+0],20,-373897302);t=o(t,u,e,v,r[i+5],5,-701558691);v=o(v,t,u,e,r[i+10],9,38016083);e=o(e,v,t,u,r[i+15],14,-660478335);u=o(u,e,v,t,r[i+4],20,-405537848);t=o(t,u,e,v,r[i+9],5,568446438);v=o(v,t,u,e,r[i+14],9,-1019803690);e=o(e,v,t,u,r[i+3],14,-187363961);u=o(u,e,v,t,r[i+8],20,1163531501);t=o(t,u,e,v,r[i+13],5,-1444681467);v=o(v,t,u,e,r[i+2],9,-51403784);e=o(e,v,t,u,r[i+7],14,1735328473);u=o(u,e,v,t,r[i+12],20,-1926607734);t=c(t,u,e,v,r[i+5],4,-378558);v=c(v,t,u,e,r[i+8],11,-2022574463);e=c(e,v,t,u,r[i+11],16,1839030562);u=c(u,e,v,t,r[i+14],23,-35309556);t=c(t,u,e,v,r[i+1],4,-1530992060);v=c(v,t,u,e,r[i+4],11,1272893353);e=c(e,v,t,u,r[i+7],16,-155497632);u=c(u,e,v,t,r[i+10],23,-1094730640);t=c(t,u,e,v,r[i+13],4,681279174);v=c(v,t,u,e,r[i+0],11,-358537222);e=c(e,v,t,u,r[i+3],16,-722521979);u=c(u,e,v,t,r[i+6],23,76029189);t=c(t,u,e,v,r[i+9],4,-640364487);v=c(v,t,u,e,r[i+12],11,-421815835);e=c(e,v,t,u,r[i+15],16,530742520);u=c(u,e,v,t,r[i+2],23,-995338651);t=h(t,u,e,v,r[i+0],6,-198630844);v=h(v,t,u,e,r[i+7],10,1126891415);e=h(e,v,t,u,r[i+14],15,-1416354905);u=h(u,e,v,t,r[i+5],21,-57434055);t=h(t,u,e,v,r[i+12],6,1700485571);v=h(v,t,u,e,r[i+3],10,-1894986606);e=h(e,v,t,u,r[i+10],15,-1051523);u=h(u,e,v,t,r[i+1],21,-2054922799);t=h(t,u,e,v,r[i+8],6,1873313359);v=h(v,t,u,e,r[i+15],10,-30611744);e=h(e,v,t,u,r[i+6],15,-1560198380);u=h(u,e,v,t,r[i+13],21,1309151649);t=h(t,u,e,v,r[i+4],6,-145523070);v=h(v,t,u,e,r[i+11],10,-1120210379);e=h(e,v,t,u,r[i+2],15,718787259);u=h(u,e,v,t,r[i+9],21,-343485551);t=l(t,s);u=l(u,A);e=l(e,g);v=l(v,b)}if(a==16){return Array(u,e)}else{return Array(t,u,e,v)}}function i(r,n,t,a,u,e){return l(s(l(l(n,r),l(a,e)),u),t)}function f(r,n,t,a,u,e,v){return i(n&t|~n&a,r,n,u,e,v)}function o(r,n,t,a,u,e,v){return i(n&a|t&~a,r,n,u,e,v)}function c(r,n,t,a,u,e,v){return i(n^t^a,r,n,u,e,v)}function h(r,n,t,a,u,e,v){return i(t^(n|~a),r,n,u,e,v)}function l(r,n){var t=(r&65535)+(n&65535);var a=(r>>16)+(n>>16)+(t>>16);return a<<16|t&65535}function s(r,n){return r<<n|r>>>32-n}function A(r){var n=Array();var a=(1<<t)-1;for(var u=0;u<r.length*t;u+=t){n[u>>5]|=(r.charCodeAt(u/t)&a)<<u%32}return n}function g(n){var t=r?"0123456789ABCDEF":"0123456789abcdef";var a="";for(var u=0;u<n.length*4;u++){a+=t.charAt(n[u>>2]>>u%4*8+4&15)+t.charAt(n[u>>2]>>u%4*8&15)}return a}return u}();

var $       = window.jQuery
  , msg     = window.XF.widget.msgbox
  , cookie  = window.QZFL.cookie

// rewrite
QQXF.COMMON.backToLogin = function (time) {
    msg.hide()
    if (time === 13) return logout() // user click logout

    var uin = localStorage.getItem('uin')
      , passhex = localStorage.getItem('passhex')

    // autologin
    if (uin && passhex) {
        msg.show('自动登录中...', 0, 5000, true)
        checkVC(uin, function (code, vcode, vc) {
            if (code == '0') { // no captcha
                login(uin, passhex, vcode, vc)
            } else { // captcha
                g_pop_login.showVC(function (vcode) {
                    login(uin, passhex, vcode, vc)
                }, uin)
            }
        })
    } else {
        // self login
        g_pop_login.showLogin(function (uin, pass, vcode, vc, save) {
            var passhex = hexchar2bin( md5(pass) )
        
            localStorage.setItem('uin', uin)
            if (save) { // save pass
                localStorage.setItem('passhex', passhex)
            }

            login(uin, passhex, vcode, vc)
        }, uin)
    }
}

// vc
var vcallback
function checkVC(uin, callback) {
    vcallback = callback
    $.getScript('http://check.ptlogin2.qq.com/check?uin=' +uin)
}
window.checkVC = checkVC // export
// check vc callback
//ptui_checkVC('0','!JTF','\x00\x00\x00\x00\x20\x56\x38\xb0');
window.ptui_checkVC = function (code, vcode, vc) {
    vcallback.apply(null, arguments)
}

// login main
function login (uin, passhex, vcode, vc) {
    $.getScript(['http://ptlogin2.qq.com/login'
      , '?u=' +uin
      , '&p=' +md5( md5(passhex+vc) +vcode.toUpperCase() )
      , '&verifycode=' +vcode

        // useles but necessary for request
      , '&u1=http%3A%2F%2Fqq.com&aid=1&h=1&from_ui=1&g=1'
    ].join(''))
}

// login callback
// code? ? url ? info usr
//ptuiCB('4','3','','0','登录失败，请重试。*', '100000');
window.ptuiCB = function (code, x, url, x2, tip, usr) {
    if (code == '0') {
        msg.show(tip, 1, 5000)
    } else {
        msg.show(tip, 2, 5000)
        localStorage.removeItem('passhex')
    }

    setTimeout(function () {
        window.location.reload()
    }, 800)
}


// logout main
function logout() {
    cookie.del('uin', 'qq.com')
    cookie.del('skey', 'qq.com')
    localStorage.removeItem('uin')
    localStorage.removeItem('passhex')
    msg.show('已退出', 3, 2000)
    window.location.reload()
}
/// =====
})


/**
 * magnet
 */
injectScript(function () {
// ======
var $   = window.jQuery
  , msg = window.XF.widget.msgbox


// orignal code by binux
// https://gist.github.com/binux/4585941
$('#input_tips').text('请输入HTTP/eD2k/magnet链接').each(function () {
    var $tips = $(this)
    // rewrite
    var _info = EventHandler.set_hide_info
      , input = $('#dl_url_id').get(0)
      
    var isMagnet = /^magnet:\?/i
    EventHandler.set_hide_info = function () {
        var url = input.value//.replace(/,/g, '_')

        if ( isMagnet.test(url) ) {
            addMagnetTask(url)

            // clean up
            input.value = ''
            $tips.blur()
        } else {
            _info.apply(EventHandler, arguments)
        }

    }
})


function addMagnetTask(url) {
    window.g_pop_task.hide()
    msg.show('解析magnet链接中...', 0, 20000, true)

    $.ajax({
      // callback name is hard coded
        url     : 'http://pew.rhyzx.im/xl-magnet?callback=queryUrl'
      , data    : { u : url }
      , cache   : true
      , dataType: 'script'
    })
}

// mock bt upload function
// extract show bt files select function
var showFileList
!(function () {
    var tmp = window.AjaxUpload
    window.AjaxUpload = function ($e, options) {
        showFileList = options.onComplete
    }
    window.initTorrent() // call
    window.AjaxUpload = tmp // revert
})()

// callback
window.queryUrl = function (
        flag, infohash, fsize,
        bt_title, is_full, subtitle, subformatsize,
        size_list, valid_list, file_icon, findex, random
) {
    msg.hide()

    if (flag !== 1) return showFileList()

    var files = []
    for (var i = 0, len=subtitle.length; i<len; i++) {
        files.push({
            file_index  : findex[i]
          , file_name   : subtitle[i]
          , file_size   : subformatsize[i]
          , file_size_ori : parseInt(size_list[i], 10)
        })
    }

    showFileList(null, JSON.stringify({
        ret : 0
      , name: bt_title
      , hash: infohash.toLowerCase()
      , files : files
    }))
}

/// =====
})


/**
 * fold bt
 * TODO update bt info when task update
 */
injectScript(function () {
// ======

var $       = window.jQuery
  , format  = new CTaskParaFormat

// fix bt fold
var _showList = CTaskOp.prototype.showListFromCache
CTaskOp.prototype.showListFromCache = function (firstGet) {
    _showList.call(this, true) // always firstGet
}

// rewrite
// add url to new task
var _getInfo = CTaskOp.prototype.getTaskTemplateInfo
CTaskOp.prototype.getTaskTemplateInfo = function (task) {
    var info = _getInfo.apply(this, arguments)
    if (!task.task_type && !task.file_url) {
        info.task_org_url = task.bt_id
    }
    return info
}

// rewrite
var _show = QQVIP.template.show
QQVIP.template.show = function (options) {
    var taskList = options.JSON, newList = []

    var bt // last bt task
      , key = 0
    for (var i=0, task; task=taskList[i++];) {
        // show full name
        task.task_short_file_name = task.task_file_name

        // bt task url pattern: hash_index
        // eg. task_org_url: "DB7B0F2264494DAFCD20CACB410399CC65230819_0"
        var hash = (task.task_org_url || '').split('_')
        if (hash.length > 1) { // is bt
            if (!bt || bt.hash !== hash[0]) { // new bt
                bt = {
                    hash            : hash[0]
                  , count           : 0
                  , cloudplayer_status : 'player_hide'
                  //, cloudplayer_url: '###'
                  , eyun_status     : 'eyun_hide'
                  //, hash: '181674167CD5C63034A212F2BD120BE8A7D8E5E9'
                  //, not_empty: ''
                  , org_file_size   : 0
                  //, player_status: 'player_ok'
                  //, player_url: 'id=181674167CD5C63034A212F2BD120BE8A7D8E5E9&uin=542521520'
                  //, task_dl_local_class: ''
                  , task_dl_speed   : 'BT任务'
                  , task_done_percent : '0%'
                  //, task_done_percent_class: 'green'
                  , task_file_name  : '[BT]' +task.task_file_name
                  , task_file_size  : '0'
                  , task_file_type  : 'icon_bt'
                  , task_id         : 'bt_' +key++ // key for select
                  , task_left_days  : task.task_left_days
                  //, task_org_url: '8DAB9FC87D97F44B3C613C4F75D09094E3291DB6_6'
                  //, task_org_url_class: 'elem_hide'
                  , task_row_status : 'bt_row'
                  //, task_share_class: ''
                  , task_short_file_name : '[BT]' +task.task_file_name
                  , task_status     : 'icon_bt_unfold' 
                }
                newList.push(bt)
            }

            // add class for toggle display
            task.task_row_status = (task.task_row_status || '') +' bt_task_row ' + bt.task_id

            // update bt summary info
            bt.count++
            bt.org_file_size += task.org_file_size
            bt.task_file_size = format.formatFilesize(bt.org_file_size)
            var percent = parseInt(bt.task_done_percent)/bt.count * (bt.count- 1)
                        + parseInt(task.task_done_percent)/bt.count

            bt.task_done_percent = percent.toFixed(2) +'%'


            bt.task_done_percent_class = bt.task_done_percent === '100%' ? 'green' : ''
            
        }


        newList.push(task)
    }

    options.JSON = newList
    _show.call(QQVIP.template, options)
}

// rewrite
// toggle bt tasks display
var isBt    = /^bt_/, $curr = $()
EventHandler.task_op_display = function (obj, taskid) {
    var $e = $(obj)

    // bt row, toggle it's task list
    if (taskid.match(isBt)) {
        var $items = $('#task_info_body > .' +taskid)

        var show = !!$e.data('show')
        $e.data('show', !show)
        show ? $items.hide() : $items.show()
        
    // normal task, show info
    // default hanlder will clear DOM class
    // so show info by self code
    } else {
        EventHandler.get_http_url(taskid) // show normal download link
        $curr.removeClass('bg_curr')
        $curr = $e.parent().parent()

        // only show visible task's info
        if ($curr.is(':visible')) $curr.addClass('bg_curr')
    }
}

// select all in bt
$(document).delegate('.bt_row .seltbox input', 'click', function () {
    var $items = $('#task_info_body > .' +this.id.slice(9)) // task_sel_bt_0
    $items.find('.seltbox input').attr('checked', this.checked)
    EventHandler.set_top_button() // enable/disable export btn
})


/// =====
})


/**
 * TODO add multi task
 */
injectScript(function () {
// ======
var $ = window.jQuery
/// =====
})



/**
 * others
 */
injectScript(function () {
// ======
var $ = window.jQuery

// break normal download restrict
EventHandler.httpDownload = function () {
// big size download will be blocked by default
// just clear this code
}

/// =====
})





/**
 * download dialogBox
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
                <a class="icon_file ex_file_orbit" href="javascript:;" target="_blank"
                    title="orbit"
                    download="orbit.olt"
                >存为Orbit文件</a>
            </p>
            <div class="ex_code">
                <textarea readonly wrap="off"></textarea>
            </div>
        </div>
        </div>
    </div>
    <div class="com_win_foot_wrap"><div class="com_win_foot"></div></div>
</div>
*/}).toString().slice(16, -4)).appendTo('#popup_area')


var $file = $export.find('.ex_file_aria')
  , $code = $export.find('.ex_code textarea:first')

  , $idm  = $export.find('.ex_file_idm')
  , $orbit= $export.find('.ex_file_orbit')

// setup dialog function
var pop = window.g_pop_export = new xfDialog('ex_pop_export_dl')


pop.setDownloads = function (dls) {
    var file = '', code = '', idm = '', orbit = ''

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

        orbit += dl.url 
          +'|' +dl.filename.replace(/\|/g, '_')
          +'||FTN5K=' +dl.cookie
          +'\r\n'
    }

    $file.attr('href', 'data:text/plain;charset=utf-8,' +encodeURIComponent(file))
    $code.val(code)

    $idm.attr('href', 'data:text/plain;charset=utf-8,' +encodeURIComponent(idm))
    $orbit.attr('href', 'data:text/plain;charset=utf-8,' +encodeURIComponent(orbit))
}

/// =====
})


/**
 * rpc config dialogBox
 */
injectScript(function () {
// ======

var $       = window.jQuery
  , xfDialog= window.xfDialog
  , msg     = window.XF.widget.msgbox

var $rpc = $((function () {/*
<div id="ex_rpc_config" class="com_win">
    <div class="com_win_head_wrap"> <h1><em>Aria RPC设置</em> <span class="close_win" title="关闭"><a href="###"></a></span></h1></div>
    <div class="com_win_cont_wrap">
        <div class="com_win_cont">
            <div class="pop">
                <div class="con">
                    <form action="#">
                        <div class="">
                            <p class="p1"><label>地址：</label><input name="url" type="text"></p>
                            <p class="p2"><label>用户：</label><input name="user" type="text"></p>
                            <p class="p2"><label>密码：</label><input name="pass" type="password"></p>
                        </div>
                        <p class="discr">
                            <a href="javascript:;" class="com_opt_btn ok"><span><em>确定</em></span></a>
                        </p>
                    </form>
                    <p style="margin-top:20px"><code>&gt; aria2c --enable-rpc=true --rpc-allow-origin-all=true --rpc-user=test --rpc-passwd=123</code></p>
                </div>
            </div>
        </div>
    </div>
    <div class="com_win_foot_wrap"><div class="com_win_foot"></div></div>
</div>
*/}).toString().slice(16, -4)).appendTo('#popup_area')

var pop = window.g_pop_rpc = new xfDialog('ex_rpc_config')

var elements    = $rpc.find('form:first').get(0).elements
  , url = elements.url
  , user = elements.user
  , pass = elements.pass


pop.showConfig = function (config) {
    config = config || {}
    url.value = config.url || 'http://localhost:6800/jsonrpc'
    user.value = config.user || ''
    pass.value = config.pass || ''
    this.show()
}

$rpc.find('.ok:first').click(function () {
    pop.hide()
    localStorage.setItem('rpc-url', url.value)
    localStorage.setItem('rpc-user', user.value)
    localStorage.setItem('rpc-pass', pass.value)
})

/// =====
})


/**
 * login dialogBox
 */
injectScript(function () {
// ======

var $       = window.jQuery
  , xfDialog= window.xfDialog
  , msg     = window.XF.widget.msgbox

var $login = $((function () {/*
<div id="login_win" class="com_win">
    <div class="com_win_head_wrap"> <h1><em>登录</em> <span class="close_win" title="关闭"><a href="###"></a></span></h1></div>
    <div class="com_win_cont_wrap">
        <div class="com_win_cont">
            <div class="pop">
                <div class="con">
                <form action="#">
                    <div class="ex_login_area">
                        <p class="p1"><label>QQ帐号：</label><input name="uin" type="text"></p>
                        <p class="p2"><label>QQ密码：</label><input name="pass" type="password"></p>
                    </div>
                    <div class="ex_vc_area" style="display:none">
                        <p class="p2" style="">
                            <label>验证码：</label>
                            <input class="ex_vcode" name="vcode" type="text" />
                            <img class="ex_vimg" width="130" height="53">
                        </p>
                    </div>
                    <p class="discr">
                        <a href="javascript:;" class="ex_login_btn com_opt_btn"><span><em>登录</em></span></a>
                        <span class="ex_login_area">
                            <input class="ex_check_box" name="save" type="checkbox">
                            <span>自动登录</span>
                        </span>
                    </p>
                </form>
                </div>
            </div>
        </div>
    </div>
    <div class="com_win_foot_wrap"><div class="com_win_foot"></div></div>
</div>
*/}).toString().slice(16, -4)).appendTo('#popup_area')

var pop = window.g_pop_login = new xfDialog('login_win')

var elements    = $login.find('form:first').get(0).elements

var $vcArea     = $login.find('.ex_vc_area')
  , $loginArea  = $login.find('.ex_login_area')

var $vimg       = $login.find('.ex_vimg').click(function () {
      // refresh captcha pic
    this.src = 'http://captcha.qq.com/getimage?uin='
        +this.getAttribute('data-uin')
        +'&' +Date.now()
})


var action, vc
$login.find('.ex_login_btn').click(function () {
    pop.hide()
    msg.show('登录中...', 0, 5000, true)
    action()
})

// only show vc dialog
pop.showVC = function (callback, uin) {
    action = function () {
        callback(elements.vcode.value)
    }
    $loginArea.hide()
    $vcArea.show()
    $vimg.attr('data-uin', uin).click()
    pop.show()
}


// show login dialog
pop.showLogin = function (callback, uin) {
    action = function () {
        callback(elements.uin.value, elements.pass.value, elements.vcode.value, vc, elements.save.checked)
    }
    pop.show()

    // set uin and checkVC
    if (uin) $(elements.uin).val(uin).change()
}


// check vc when qq changed
$(elements.uin).change(function () {
    var uin = this.value
    if (uin.length > 4) {
        msg.show('检测帐号中...', 0, 5000)
        checkVC(uin, function (code, vcode, _vc) {
            msg.hide()
            vc = _vc
            
            if (code == '0') { // no captcha
                $vcArea.hide()
                elements.vcode.value = vcode
            } else { // need captcha
                $vcArea.show()
                $vimg.attr('data-uin', uin).click() // show pic
            }
        })
    }
})

/// =====
})


/**
 * overwrite CSS
 */
injectStyle((function () {/*
.top,
.search_box,
#share_opt,
#down_box {
    display: none !important;
}
#cont_wrap, #tbl_tpl_id, .box, .filename em {
    width: auto !important;
}

.main {
    width: auto;
    margin-left: 50px;
    margin-right: 50px;
}
.tablebox .tit_h th {
    background-repeat: repeat;
}


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
    margin: 8px;
}
.ex_file a {
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
#login_win input {
    padding: 0 5px;
    width: 220px;
    background: #FFF;
}
#login_win .ex_vcode {
    display: inline-block;
    width: 80px;
}
#login_win .ex_check_box {
    width: 16px;
}
.ex_login_btn {
    float: none;
}
.ex_vimg {
    vertical-align: middle;
}

.bt_row {
    background: #f6fef8;
}
.bt_task_row {
    display: none;
}
.bt_task_row td:first-child ,
.bt_row  td:first-child {
    border-left: 3px solid #9fe5b1;
}
.bt_task_row .seltbox input {
    margin-left: 20px;
}
.icon_bt {
    padding-left: 20px;
    height: 16px;
    line-height: 16px;
    font-style: normal;
    background-repeat: no-repeat;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGrSURBVDjLxZO7ihRBFIa/6u0ZW7GHBUV0UQQTZzd3QdhMQxOfwMRXEANBMNQX0MzAzFAwEzHwARbNFDdwEd31Mj3X7a6uOr9BtzNjYjKBJ6nicP7v3KqcJFaxhBVtZUAK8OHlld2st7Xl3DJPVONP+zEUV4HqL5UDYHr5xvuQAjgl/Qs7TzvOOVAjxjlC+ePSwe6DfbVegLVuT4r14eTr6zvA8xSAoBLzx6pvj4l+DZIezuVkG9fY2H7YRQIMZIBwycmzH1/s3F8AapfIPNF3kQk7+kw9PWBy+IZOdg5Ug3mkAATy/t0usovzGeCUWTjCz0B+Sj0ekfdvkZ3abBv+U4GaCtJ1iEm6ANQJ6fEzrG/engcKw/wXQvEKxSEKQxRGKE7Izt+DSiwBJMUSm71rguMYhQKrBygOIRStf4TiFFRBvbRGKiQLWP29yRSHKBTtfdBmHs0BUpgvtgF4yRFR+NUKi0XZcYjCeCG2smkzLAHkbRBmP0/Uk26O5YnUActBp1GsAI+S5nRJJJal5K1aAMrq0d6Tm9uI6zjyf75dAe6tx/SsWeD//o2/Ab6IH3/h25pOAAAAAElFTkSuQmCC)
}

.bg_curr {
    pointer: normal !important;
    background: #d2eeff !important;
}
.bg_curr .p2 {
    display: block !important;
}
#ex_rpc_config {
    width: 460px;
    margin-left: -230px;
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
