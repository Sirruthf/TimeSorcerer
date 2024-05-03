const isElement_t = (el) => {
    return el instanceof HTMLElement || el instanceof SVGElement;
};
const isElement_t_Collection = (col) => {
    return Array.prototype.every.call(col, item => isElement_t(item));
};
const has = (key, x) => (key in x);
class W_Generic {
    constructor(element) {
        this.element = element;
        let self = this;
        this.proxy = new Proxy(element, {
            get(target, property) {
                if (has(property, self))
                    return self[property];
                else if (has(property, target))
                    if (target[property] instanceof Function)
                        return target[property].bind(target);
                    else
                        return target[property];
                if (property == Symbol.toPrimitive || property == Symbol.toStringTag) {
                    return self.element.toString;
                } //throw new Error("Primitive conversion in " + this.constructor.name + ". Did you mean to write .raw?");
                if (property == "toJSON") {
                    return self.element.toString;
                }
                throw new Error("Element lacks specified property in " + self.constructor.name + ":" + property.toString());
            },
            set(target, property, value) {
                if (!(typeof property == "string" || typeof property == "number"))
                    throw new Error("Don't");
                if (typeof property == "number" && isNaN(property))
                    throw new Error("NaN is not a valid property name on " + this.constructor.name + ":=" + value);
                if (typeof value == "undefined")
                    throw new Error("Undefined is not a value on " + this.constructor.name + ":" + property);
                if (typeof value == "number" && isNaN(value))
                    throw new Error("NaN is not a value on " + this.constructor.name + ":" + property);
                return self.trySetProperty(target, property, value);
            }
        });
    }
    trySetProperty(target, property, value) {
        if (!has(property, target))
            return false;
        target[property] = value;
        return true;
    }
    log() {
        if (Array.isArray(this.element))
            console.log(this.element.map(item => item.raw));
        else
            console.log(this.element);
    }
}
const isCSSRule = (prop) => {
    return true;
};
const isCSSValue = (value) => {
    return true;
};
class W_SinExt extends W_Generic {
    constructor(element, receivedBy) {
        super(element);
        this.receivedBy = receivedBy;
    }
    get style() {
        let self = this;
        return new Proxy({}, {
            get(_, prop) {
                if (!isCSSRule(prop))
                    throw new Error("Shouldn't happen");
                let result = self.element.style[prop];
                if (result != null)
                    return result;
                throw new Error("Malformed style property");
            },
            set(_, prop, value) {
                if (!isCSSRule(prop) || !isCSSValue(value))
                    throw new Error("Shouldn't happen");
                self.element.style[prop] = value;
                return true;
            }
        });
    }
    get raw() {
        return this.element;
    }
    get stamp() {
        return this.constructor.toString();
    }
    get index() {
        if (!this.element.parentElement)
            throw new Error("Called on the top-level element");
        return [...this.element.parentElement.children].indexOf(this.element);
    }
    get next() {
        if (isElement_t(this.element.nextElementSibling))
            return Q(this.element.nextElementSibling);
        else
            throw new Error("No sibling found");
    }
    get child() {
        if (isElement_t(this.element.firstElementChild))
            return Q(this.element.firstElementChild);
        else
            throw new Error("No children found");
    }
    get children() {
        return Q(this.element.children, true);
    }
    /* altering */
    content(value) { this.element.innerHTML = value; return this.proxy; }
    class(_class, positive = true) { positive ? this.element.classList.add(_class) : this.element.classList.remove(_class); return this.proxy; }
    hasClass(_class) { return this.element.classList.contains(_class); }
    on(type, callback) {
        if (!callback)
            throw Error("Callback cannot be null");
        this.element.addEventListener(type, (...args) => callback.call(this, ...args));
        return this.proxy;
    }
    append(child) {
        var _a;
        if (!child)
            throw new Error("Cannot append undefined");
        if (((_a = child.stamp) === null || _a === void 0 ? void 0 : _a.name) == "W_SinExt")
            this.element.append(child.raw);
        else
            this.element.append(child);
    }
    prepend(child) {
        if (!child)
            throw new Error("Cannot prepend undefined");
        if ("stamp" in child && child.stamp.name == "W_SinExt")
            this.element.prepend(child.raw);
        else
            this.element.prepend(child);
    }
    replaceWith(child) {
        if (!child)
            throw new Error("Cannot replaceWith undefined");
        if (child.stamp && child.stamp.name == "W_SinExt")
            this.element.replaceWith(child.raw);
        else
            this.element.replaceWith(child);
    }
    to(css, m = false) { return m ? Q(css, true, this.element, this.receivedBy) : Q(css, false, this.element); }
    near(selector, m = false) {
        if (!this.element.parentElement)
            throw new Error("Wtf dude");
        let children = Q(this.element.parentElement).to(selector, true);
        return m ? children.filter(item => item.raw != this.raw) : children.find(item => item.raw != this.raw);
    }
    from(selector) {
        if (this.element.parentElement == null)
            throw new Error("Parent list does not include element(s) matching provided selector: " + selector);
        let parent = Q(this.element.parentElement);
        if (parent.matches(selector) || !selector)
            return parent;
        else
            return parent.from(selector);
    }
}
class W_ListExt extends W_Generic {
    constructor(list) {
        super(list);
    }
    get style() {
        let self = this;
        return new Proxy({}, {
            get() {
                throw new Error("This does not quite make sense");
            },
            set(_, prop, value) {
                self.element.forEach(item => item.style[prop] = value);
                return true;
            }
        });
    }
    /* altering */
    on(type, callback) { this.element.forEach(element => element.on(type, callback)); return this.proxy; }
    remove() { this.element.forEach(element => element.remove()); return this.proxy; }
    content(value) { this.element.forEach(element => element.content(value)); return this.proxy; }
    /* creational */
    to(selector) { return new W_ListExt(this.element.map(element => element.to(selector))); }
    near(selector) { return new W_ListExt(this.element.map(element => element.near(selector))); }
    child() { return new W_ListExt(this.element.map(element => element.child)); }
    from(selector) { return new W_ListExt(this.element.map(element => element.from(selector))); }
}
function Q(input = document.documentElement, m = false, parent = document.documentElement, parentClass = "") {
    return !m ?
        Q_typed(input, m, parent, parentClass) :
        Q_typed(input, m, parent, parentClass);
}
function Q_typed(input = document.documentElement, m = false, parent = document.documentElement, parentClass = "") {
    let wrapper;
    let query = "";
    if (!input)
        throw new Error("!input");
    if (typeof input == "string") {
        if (input.includes("&") && !parentClass)
            throw new Error("Invalid parent alias: element is the first in the chain or was created from raw");
        query = input.replace("&", parentClass);
        input = m ? [...parent.querySelectorAll(query)] : parent.querySelector(query);
    }
    if (input instanceof HTMLElement) {
        wrapper = new W_SinExt(input, query);
    }
    else if (input instanceof HTMLCollection || Array.isArray(input)) {
        let inarr = [...input];
        if (isElement_t_Collection(inarr))
            wrapper = new W_ListExt(inarr.map(item => new W_SinExt(item, input.toString()).proxy));
        else
            throw new Error("Malformed HTMLCollection");
    }
    else {
        throw new Error("Source element type not supported: \"" + input + "\"");
    }
    return wrapper.proxy;
}
function Q_template(input, options) {
    if (!input)
        throw new Error("Input cannot be null");
    let target;
    let raw_target;
    let source_string;
    if (typeof input == "string" && isSelectorValid(input)) {
        target = Q(input);
        if (!target)
            throw new Error("No templates found by the selector");
        source_string = target.raw.innerHTML;
    }
    else if (input instanceof HTMLElement) {
        raw_target = input;
        source_string = raw_target.innerHTML;
    }
    else if (typeof input == "string")
        source_string = input;
    else
        source_string = input.raw.innerHTML;
    for (let option in options)
        source_string = source_string.replace(new RegExp(`{ ${option} }`, "g"), options[option]);
    let tmp = document.createElement("div");
    tmp.innerHTML = source_string;
    if (tmp.firstElementChild != null && tmp.firstElementChild instanceof HTMLElement)
        return Q(tmp.firstElementChild);
    else
        throw new Error("Something's gone very wrong");
}
function isSelectorValid(selector) {
    try {
        document.createDocumentFragment().querySelector(selector);
    }
    catch (err) {
        return false;
    }
    return true;
}
export default new class extends Function {
    constructor() {
        super("...args", "return this.search(...args);");
        return this.bind(this);
    }
    search(...args) { return Q(...args); }
    tmplt(...args) { return Q_template(...args); }
}();
