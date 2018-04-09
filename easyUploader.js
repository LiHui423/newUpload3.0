/*
    用法：
    var uploader = new EasyUplader(objOpts);實例化EasyUplader
    其中的諸多方法：
    uploader.preview:圖片預覽方法
        參數：file 文件
              fn 回調，引入onSelectImage方法，將圖片插入頁面中，回調參數是file和圖片對象
    uploader.getFileList: 獲取文件隊列，包括數組和formdata
    uploader.setFileParam:設置單個文件參數,將參數字符串加入參數數組中
        參數：str 隨著單個文件的上傳附帶
    uploader.setParm:檢測傳入的參數是否是壹個對象，並將參數加入formdata中
    uploader.onSelectImage:圖片預覽
        參數：file 調用preview方法時傳入的文件
              imgobj 傳入的圖片對象
    uploader.onSelectFile:getFile方法中調用的獲得單個文件參數的方法
        參數：file 文件對象
    uploader.onError: 文件信息錯誤調用的方法
    uploader.onBeforeSend:文件上傳之前進行的參數設置并保存在參數數組中
    uploader.onSubmitSuccess:文件上傳成功后執行的函數
    
    
    參數說明：
    pickerId:選擇文件的按鈕
    server:上傳文件的服務器地址
    submitBtnId:提交按鈕
    multiple:是否多文件上傳
    method:上傳方法
    isPreview:是否預覽
    maxlength:上傳文件最大數量
    maxSize:上傳最大的文件大小
    fileType:上傳文件類型
    
*/

/*global $ createObjectURL webkitURL*/
/**
 * @author sweet_potato
 * @description EasyUplader類，代表上傳文件的函數
 * @constructor
 * @param {Object} opts
 * @param {string} opts.pickerId - 這是form標簽的id
 * @param {Object} picker -label標簽
 * @param {Object} pickFile -input標簽
 * @param {string} pickFileId -input標簽的id
 * @param {Object} dropArea -拖拽區域（未使用）
 * @param {Object} $('#'+opts.submitBtnId) -提交按鈕的id
 * @param {boolean} opts.multiple -是否支持多文件上傳(默認false)
 * @param {string} opts.method -上傳文件方式(默認post)
 * @param {string} opts.server -服務器路徑
 * @param {boolean} opts.isPreview -上傳後是否預覽
 * @param {function} opts.onSelectImage -選擇圖片進行預覽
 * @param {function} opts.onSelectFile -選擇自定義參數
 * @param {Array} new Array() -文件隊列
 * @param {function} createLabel() -創建引用
 * @param {function} createForm() -創建form表單
 * @param {function} createFile() -創建File控件
 * @param {number} opts.maxlength -上傳文件數量最大值
 * @param {function} new FormData() -FormData方法
 * @param {function} opts.onError -文件錯誤時調用的方法
 * @param {Array} opts.fileType -文件類型數組
 * @param {function} opts.onBeforeSend -上傳文件前傳遞的相關參數
 * @param {function} submitBtn -提交按鈕被點擊
 * @param {number} opts.maxSize -上傳文件大小最大值
 * @param {boolean} opts.isDropUpload -是否拖拽上傳
 * @param {function} opts.onSubmitSuccess -上傳成功后調用
 * @param {function} doSubmit() -提交上傳
 * @param {Object} param=() -單個文件參數隊列
 * 
 */
function EasyUplader(opts){
    this.pickerId = opts.pickerId;
    this.picker;
    this.pickFile;//input
    this.pickFileId;
    this.dropArea;
    this.submitBtn = $('#'+opts.submitBtnId); //提交按钮
    this.multiple = opts.multiple || false; //是否支持多文件上传
    this.method = opts.method || 'POST';//提交方式
    this.server = opts.server; //服务器路径
    this.isPreview = opts.isPreview;
    this.onSelectImage = opts.onSelectImage;
    this.onSelectFile = opts.onSelectFile;
    this.uploadList = new Array();   //文件队列
    this.createLabel(); //创建引用
    this.createForm(); //创建form表单
    this.createFile();	//创建File控件
    this.maxlength = opts.maxlength;//上传最大文件数
    this.formData = new FormData();
    this.onError = opts.onError;
    this.fileType = opts.fileType;
    this.onBeforeSend = opts.onBeforeSend;
    this.submitBtn.on('click', function(){});
    this.maxSize =opts.maxSize;//上传大小限制
    this.isDropUpload=opts.isDropUpload;
    this.onSubmitSuccess = opts.onSubmitSuccess;
    // this.createDropArea();
    this.doSubmit();//提交上传
    this.param = {
        list : new Array()
    }
}
EasyUplader.prototype = {
    //拖拽上傳方法暫時不使用
    /*拖拽上传（目前不考虑此功能）
    createDropArea:function() {
        var self=this;
        if (this.isDropUpload === true) {
            this.dropArea = $(document.createElement('div'));
            this.dropArea.css({
                width: '400px',
                height: '150px',
                border: '1px dashed #CCCCCC',
                textAlign: 'center',
                verticalAlign: 'center',
                color: '#CCCCCC',
                zIindex:'9999'
            });
            this.dropArea.addClass('drop_area');
            this.dropArea.append('<p>或将图片拖拽到此区域</p>');
            $('body').append(this.dropArea);
        }
        //开始拖拽
        //阻止浏览器默认行为(离开;释放;进入;悬停)
        $(document).on({
            dragleave: function (e) {
                e.preventDefault();
            },
            drop: function (e) {
                e.preventDefault();
            },
            dragenter: function (e) {
                e.preventDefault();
            },
            dragover: function (e) {
                e.preventDefault()
            }
        });
        //获取 "拖拽区域"
        var drop_area = document.querySelector(".drop_area");
        //绑定事件 拖动释放
        drop_area.ondrop = function (e) {
            e.preventDefault();
            //获取文件对象
            var fileList = e.dataTransfer.files;
            var file=fileList[0];
            //console.log(file);
            //console.log(fileList);
            //获取拖动上传文件个数量==0 停止
            if (fileList.length == 0) {
                alert("没有图片上传");
                return;
            }
            var rs  = fileList[0].type.indexOf("image");
            if(rs==-1){
                alert("只能上传图片格式类型");
                return;
            }
            //获取上传文件大小 如果超过512K 阻止上传
            var size = Math.floor(fileList[0].size/1024);
            if(size>this.maxSize){
                alert("上传图片太大，不能超过 512KB");
                return;
            }
            self.createFile();
            self.getFile(file);
        }
    },*/
    //创建form表单
    createForm : function(){
        var newForm = document.createElement('form');
        $(newForm).attr({
            method : this.method,
            action : this.server,
            enctype : 'application/x-www-form-urlencoded',
            id : this.pickerId + 'form',
        }).css({
            'display' : 'none'
        });
        $('body').append(newForm);
    },
    createFile: function(){
        var self = this;
        this.pickFile = document.createElement('input');
        this.pickFileId = this.pickerId + 'file' + $('#' + this.pickerId + 'form input[type=file]').length;
        $(this.pickFile).attr({
            type : 'file',
            id : this.pickFileId
        });
        this.pickFile.multiple = this.multiple;
        $('#'+this.pickerId + 'form').append(this.pickFile);
        this.picker.attr('for', this.pickFileId);
        $(this.pickFile).on('change', function() {
            var files = $(this)[0].files;
            var olen = self.uploadList.length;
            var nlen = files.length;
            var max = self.maxlength;
            var delidx;
            if(olen + nlen > max) {
                delidx = max - olen;
            }
            $.each(files, function (k, y) {
                if(delidx == undefined){
                    self.getFile(y);
                }else{
                    if(k<delidx){
                        self.getFile(y);
                    }else{
                        self.onError('number');
                        return false;
                    }
                }
            });
        });
    },
    createLabel : function(){
        this.picker = $(document.createElement('label'));
        this.picker.css({
            position : 'absolute',
            top : '0px',
            left : '0px',
            right : '0px',
            bottom : '0px',
            cursor : 'pointer'
        }).attr({
            'for' : this.pickFileId
        });
        $('#'+this.pickerId).css({
            position : 'relative'
        }).append(this.picker);
    },
    getFile: function(file){
        var type = file.type;
        var size=file.size;
        if(this.fileType.indexOf(type, 0) == -1){
            this.onError('type');
            return false;
        }else if(this.uploadList.length == this.maxlength){
            this.onError('number');
            return false;
        }else if(size/1024/1024>=this.maxSize){
            this.onError('size');
            return false;
        }
        var fileId = 'easyUploader-file' + this.uploadList.length;
        file.id = fileId;
        this.uploadList.push(file);
        this.formData.append('file', file);
        if(this.isPreview){
            this.preview(file, function(a, b){
                this.onSelectImage&&this.onSelectImage.call(this, a, b);
            });
        }
        this.onSelectFile&&this.onSelectFile.call(this, file);
    },
    preview: function(file, fn) {
        var self = this;
        if(URL.createObjectURL || createObjectURL || webkitURL.createObjectURL) {
            var img = new Image(), url = img.src = self.createObjectURL(file);
            var $img = $(img);
            $(img).on('load', function() {
                self.revokeObjectURL(url);
                fn.call(self, file, $img);
            });
        }else if(FileReader) {
            var reader = new FileReader();
            reader.readAsDataURL(file);
            $(reader).on('load', function(e) {
                var $img = $('<img>').attr("src", e.target.result);
                fn.call(self, file, $img);
            });
        } else {
            alert('您的瀏覽器不支持圖片上傳預覽');
        }
    },
    cancelFile : function(id){
        var self = this;
        this.formData = null;
        this.formData = new FormData();
        var idx=null;
        $.each(this.uploadList, function(k, y){
            if(y.id != id){
                self.formData.append('file', y);
            }else{
                idx = k;
            }
        });
        this.uploadList.splice(idx, 1);
        this.delFileParam(idx);
        this.getFileList();
        $('#'+this.pickerId + 'form')[0].reset();
    },
    getFileList : function(){
        var res = this.uploadList;
        var res1 = this.formData.getAll('file');
    },
    setFileParam : function(str){
        this.param.list.push(str);
    },
    setParm :function(k, y){
        var self=this;
        if(k instanceof Object){
            $.each(k, function(m, n){
                self.formData.append(m, n);
            });
        }else{
            this.formData.append(k, y);
        }
    },
    delFileParam:function(idx){
        this.param.list.splice(idx, 1);
    },
    doSubmit:function(){
        var self=this;
        this.submitBtn.on('click', function(){
            if(self.uploadList.length!==0){
                self.onBeforeSend&&self.onBeforeSend.call(self);
                self.formData.append('param', JSON.stringify(self.param));
                /*self.uploadProgress();*/
                $.ajax({
                    url:self.server,
                    type:self.method,
                    data:self.formData,
                    dataType:'json',
                    processData: false,
                    contentType: false,
                    success:function (data) {
                        self.onSubmitSuccess&&self.onSubmitSuccess.apply(self, [data]);
                    },
                    error:function (error) {
                        self.onError('upload');
                    }
                });
            }else{
                self.onError('upload');
            }
        })
    },
    uploadProgress:function(){
        $('.upload-component').css('display', 'block');
        this.progressBar();
    },
    progressBar:function(){
        var self=this;
        var max =100;
        var init =0;
        var uploaded = null;
        var test = setInterval(function(){
            init +=10;
            uploaded = parseInt(init / max *100)+'%';
            $('.upload-text').text(uploaded).next().css({width:uploaded});
            if(init ===100){
                clearInterval(test);
                $('.upload-text').text('上传完成');
                $('.confirm-cancel span').css({cursor:'pointer'});
                $('.confirm').css({backgroundColor:'rgb(255,82,124)'});
                $('.cancel').css({backgroundColor:'rgb(175,194,211)'})
                $('.upload-close-span,.confirm,.cancel').on('click', function(){
                    $('.upload-component').css('display', 'none');
                    self.uploadList.length=0;
                    self.param=null;
                    $('.file-temp-btn').parent().remove();
                });
            } else{
                $('.upload-close-span,.confirm,.cancel').off('click', function(){
                    $('.upload-component').css('display', 'none');
                });
                $('.upload-close-span').on('click', function(){
                    clearInterval(test);
                    $('.upload-component').css('display', 'none');
                });
            }
        }, 100);
    },
    createObjectURL : function(file){
        var url = '';
        if (window.createObjectURL!=undefined) {
            url = window.createObjectURL(file) ;
        } else if (window.URL!=undefined) {
            url = window.URL.createObjectURL(file) ;
        } else if (window.webkitURL!=undefined) {
            url = window.webkitURL.createObjectURL(file) ;
        }
        return url;
    },
    revokeObjectURL : function(url){
        if (window.createObjectURL!=undefined) {
            window.revokeObjectURL(url);
        } else if (window.URL!=undefined) {
            window.URL.revokeObjectURL(url);
        } else if (window.webkitURL!=undefined) {
            window.webkitURL.revokeObjectURL(url);
        }
    }
};
