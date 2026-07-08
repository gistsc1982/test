//添加绘制线类的扩展属性，扩展属性中可以添加比如标绘图形算法函数和各种参数属性，设置自定义属性如下 fabric.Line = fabric.Line.extend({initMyAttack_Arrow: function () {attrArrow = new L.Attack_Arrow();},});
//设置类的自定义属性之后再new出的实例就带有了L.Attack_Arrow()属性
fabric.Line.extend = function (props) {

    // extended class with the new prototype
    var NewClass = function () {

        // call the constructor
        if (this.initialize) {
            this.initialize.apply(this, arguments);
        }

        // call all constructor hooks
        if (this._initHooks) {
            this.callInitHooks();
        }
    };

    // instantiate class without calling constructor
    var F = function () { };
    F.prototype = this.prototype;

    var proto = new F();
    proto.constructor = NewClass;

    NewClass.prototype = proto;

    //inherit parent's statics
    for (var i in this) {
        if (this.hasOwnProperty(i) && i !== 'prototype') {
            NewClass[i] = this[i];
        }
    }

    // mix static properties into the class
    if (props.statics) {
        L.extend(NewClass, props.statics);
        delete props.statics;
    }

    // mix includes into the prototype
    if (props.includes) {
        L.Util.extend.apply(null, [proto].concat(props.includes));
        delete props.includes;
    }

    // merge options
    if (props.options && proto.options) {
        props.options = L.extend({}, proto.options, props.options);
    }

    // mix given properties into the prototype
    L.extend(proto, props);

    proto._initHooks = [];

    var parent = this;
    // jshint camelcase: false
    NewClass.__super__ = parent.prototype;

    // add method for calling all hooks
    proto.callInitHooks = function () {

        if (this._initHooksCalled) { return; }

        if (parent.prototype.callInitHooks) {
            parent.prototype.callInitHooks.call(this);
        }

        this._initHooksCalled = true;

        for (var i = 0, len = proto._initHooks.length; i < len; i++) {
            proto._initHooks[i].call(this);
        }
    };

    return NewClass;
};
