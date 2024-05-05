type Element_t = HTMLElement;

const isElement_t = (
    el: any
): el is Element_t => {
    return el instanceof HTMLElement || el instanceof SVGElement;
}

const isElement_t_Collection = (
    col: Element[]
): col is Element_t[] => {
    return Array.prototype.every.call(col, item => isElement_t(item));
}

type Proxy_t<B, P> = {
    [innate_keys in keyof (B & P)]: (B & P)[innate_keys];
}

type W_SinProxy_t = Proxy_t<Element_t, W_SinExt>;
type W_ListProxy_t = Proxy_t<W_SinProxy_t[], W_ListExt>;

const has = <K extends PropertyKey>(
    key: K,
    x: object,
): x is { [key in K]: unknown } => (
    key in x
);

type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? A : B;

type KeysByValue<T, V> = keyof {
[
    K in keyof T as
    T[K] extends V ? K : never
]: unknown;
};

type WritableKeys<T> = {
  [P in keyof T]-?:
    IfEquals<
      { [Q in P]: T[P] },
      { -readonly [Q in P]: T[P] },
      P
    >
}[keyof T];


class W_Generic<T extends Element_t | W_SinProxy_t[], P> {
    element: T;
    proxy: any;

    constructor (element: T) {
        this.element = element;
        let self = this;
        
        this.proxy = new Proxy (element, {
            get (target: T, property: PropertyKey): any {
                if (has<PropertyKey>(property, self))
                    return self[property];
                else if (has<PropertyKey>(property, target))
                    if (target[property] instanceof Function)
                        return (target[property] as Function).bind(target);
                    else
                        return target[property];
                
                if (property == Symbol.toPrimitive || property == Symbol.toStringTag) { return self.element.toString; } //throw new Error("Primitive conversion in " + this.constructor.name + ". Did you mean to write .raw?");
                if (property == "toJSON") { return self.element.toString; }
                
                throw new Error("Element lacks specified property in " + self.constructor.name + ":" + property.toString());
            },
            
            set (target: T, property: PropertyKey, value: any): boolean {
                if (!(typeof property == "string" || typeof property == "number"))
                    throw new Error("Don't");

                if (typeof property == "number" && isNaN(property)) throw new Error("NaN is not a valid property name on " + this.constructor.name + ":=" + value);
                if (typeof value == "undefined") throw new Error("Undefined is not a value on " + this.constructor.name + ":" + property);
                if (typeof value == "number" && isNaN(value)) throw new Error("NaN is not a value on " + this.constructor.name + ":" + property);

                return self.trySetProperty(target, property, value);
            }
        });
    }

    trySetProperty (target: T, property: string | number, value: any): boolean {        
        if (!has<string | number>(property, target))
            return false;
        
        target[property] = value;

        return true;
    }
    
    log () {
        if (Array.isArray(this.element))
            console.log(this.element.map(item => item.raw));
        else
            console.log(this.element);
    }
}


type writableRules = Extract<KeysByValue<CSSStyleDeclaration, string>, WritableKeys<CSSStyleDeclaration>>;
type stringValues = Exclude<CSSStyleDeclaration[writableRules], null>;

const isCSSRule = (
    prop: string | symbol | number
): prop is writableRules => {
    return true;
}

const isCSSValue = (
    value: string | number
): value is stringValues => {
    return true;
}

class W_SinExt extends W_Generic<Element_t, W_SinExt> {
    receivedBy: string;

    constructor (element: Element_t, receivedBy: string) {
        super(element);
        this.receivedBy = receivedBy;
    }

    get style () {
        let self = this;

        return new Proxy({}, {
            get (_: any, prop: string | symbol): stringValues {
                if (!isCSSRule(prop))
                    throw new Error("Shouldn't happen");

                let result = self.element.style[prop];

                if (result != null)
                    return result;

                throw new Error("Malformed style property");
            },

            set (_: any, prop: string | symbol, value: string | number): boolean {
                if (!isCSSRule(prop) || !isCSSValue(value))
                    throw new Error("Shouldn't happen");

                self.element.style[prop] = value;
                return true;
            }
        });
    }
    
    get raw (): Element_t {
        return this.element;
    }
    
    get stamp (): string {
        return this.constructor.toString();
    }
    
    get index (): number {
        if (!this.element.parentElement) throw new Error("Called on the top-level element");
        return [...this.element.parentElement.children].indexOf(this.element);
    }
    
    get next (): W_SinProxy_t {
        if (isElement_t(this.element.nextElementSibling))
            return Q(this.element.nextElementSibling);
        else
            throw new Error("No sibling found");
    }
    
    get child (): W_SinProxy_t {
        if (isElement_t(this.element.firstElementChild))
            return Q(this.element.firstElementChild);
        else
            throw new Error("No children found");
    }
    
    get children (): W_ListProxy_t {
        return Q(this.element.children, true);
    }
    
    /* altering */
    
    content (value: string): W_SinProxy_t { this.element.innerHTML = value; return this.proxy; }
    class (_class: string, positive = true): W_SinProxy_t { positive ? this.element.classList.add(_class) : this.element.classList.remove(_class); return this.proxy; }
    hasClass (_class: string): boolean { return this.element.classList.contains(_class); }

    on (type: keyof ElementEventMap, callback: Function): W_SinProxy_t {
        if (!callback) throw Error ("Callback cannot be null");
        this.element.addEventListener(type, (...args) => callback.call(this, ...args));
        return this.proxy;
    }    

    append (child: any): void {
        if (!child)
            throw new Error("Cannot append undefined");
        
        if (child.stamp?.name == "W_SinExt")
            this.element.append(child.raw);
        else
            this.element.append(child);
    }
    
    prepend (child: any): void {
        if (!child)
            throw new Error("Cannot prepend undefined");
        
        if ("stamp" in child && child.stamp.name == "W_SinExt")
            this.element.prepend(child.raw);
        else
            this.element.prepend(child);
    }
    
    replaceWith (child: any): void {
        if (!child)
            throw new Error("Cannot replaceWith undefined");
        
        if (child.stamp && child.stamp.name == "W_SinExt")
            this.element.replaceWith(child.raw);
        else
            this.element.replaceWith(child);
    }
    
    /* creational */
    
    to (css: string, m: true): W_ListProxy_t;
    to (css: string, m?: false): W_SinProxy_t;
    to (css: string, m: boolean = false): any { return m ? Q(css, true, this.element, this.receivedBy) : Q(css, false, this.element); }
    
    near (selector: string, m: true): W_ListProxy_t;
    near (selector: string, m?: false): W_SinProxy_t;
    near (selector: string, m: boolean = false): any {
        if (!this.element.parentElement) throw new Error("Wtf dude");

        let children = Q(this.element.parentElement).to(selector, true);
        return m ? children.filter(item => item.raw != this.raw) : children.find(item => item.raw != this.raw);
    }
    
    from (selector: string): W_SinProxy_t {
        if (this.element.parentElement == null) throw new Error("Parent list does not include element(s) matching provided selector: " + selector);
        let parent = Q(this.element.parentElement);
        
        if (parent.matches(selector) || !selector)
            return parent;
        else
            return parent.from(selector);
    }
}

class W_ListExt extends W_Generic<W_SinProxy_t[], W_ListExt> {
    constructor (list: W_SinProxy_t[]) {
        super(list);
    }
    
    get style () {
        let self = this;
        
        return new Proxy({}, {
            get () {
                throw new Error("This does not quite make sense");
            },
            
            set (_, prop, value) {
                self.element.forEach(item => item.style[prop] = value);
                return true;
            }
        });
    }
    
    /* altering */
    
    on (type: keyof ElementEventMap, callback: Function): W_ListProxy_t { this.element.forEach(element => element.on(type, callback)); return this.proxy; }
    remove (): W_ListProxy_t { this.element.forEach(element => element.remove()); return this.proxy; }
    content (value: string): W_ListProxy_t { this.element.forEach(element => element.content(value)); return this.proxy; }
    
    /* creational */
    
    to (selector: string) { return new W_ListExt(this.element.map(element => element.to(selector))); }
    near (selector: string) { return new W_ListExt(this.element.map(element => element.near(selector))); } 
    child () { return new W_ListExt(this.element.map(element => element.child)); }
    from (selector: string) { return new W_ListExt(this.element.map(element => element.from(selector))); }
}


type input = Element_t | Element_t[] | HTMLCollection | string | null;

function Q(input: input, m?: false, parent?: Element_t, parentClass?: string): W_SinProxy_t
function Q(input: input, m?: true, parent?: Element_t, parentClass?: string): W_ListProxy_t
function Q(input: input = document.documentElement, m: boolean = false, parent: Element_t = document.documentElement, parentClass: string = ""): any {
    return !m ?
        Q_typed<W_SinProxy_t>(input, m, parent, parentClass) :
        Q_typed<W_ListProxy_t>(input, m, parent, parentClass);
}

function Q_typed<T> (input: input = document.documentElement, m: boolean = false, parent: Element_t = document.documentElement, parentClass: string = ""): T {
    let wrapper: any;
    let query: string = "";

    if (!input) throw new Error("!input");
    
    if (typeof input == "string") {
        if (input.includes("&") && !parentClass) throw new Error("Invalid parent alias: element is the first in the chain or was created from raw");
        query = input.replace("&", parentClass);
        input = m ? [...parent.querySelectorAll<Element_t>(query)] : parent.querySelector<Element_t>(query);
    }

    if (input instanceof HTMLElement) {
        wrapper = new W_SinExt(input, query);
    } else if (input instanceof HTMLCollection || Array.isArray(input)) {
        let inarr = [...input];
        if (isElement_t_Collection(inarr))
            wrapper = new W_ListExt(inarr.map(item => new W_SinExt(item, input.toString()).proxy));
        else
            throw new Error("Malformed HTMLCollection");
    } else {
        throw new Error("Source element type not supported: \"" + input + "\"");
    }
    
    return wrapper.proxy;
}

function Q_template (input: W_SinProxy_t | HTMLElement | string, options?: Record<string, any>): W_SinProxy_t {
    if (!input) throw new Error("Input cannot be null");

    let target: W_SinProxy_t;
    let raw_target: HTMLElement;
    let source_string: string;

    if (typeof input == "string" && isSelectorValid(input)) {
        target = Q(input);

        if (!target)
            throw new Error("No templates found by the selector");

        source_string = target.raw.innerHTML;

    } else if (input instanceof HTMLElement) {
        raw_target = input;
        source_string = raw_target.innerHTML;

    } else if (typeof input == "string")
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

function isSelectorValid (selector: string): boolean {
    try { document.createDocumentFragment().querySelector(selector) } catch(err) { return false; } return true;
}

type search_arg_t = [input, true & false, HTMLElement, string];
type tmplt_arg_t = [W_SinProxy_t | HTMLElement | string, Record<string, any>?];
export default new class extends Function {
    constructor () {
        super("...args", "return this.search(...args);");
        return this.bind(this);
    }

    search (...args: search_arg_t): W_SinProxy_t | W_ListProxy_t { return Q(...args); }
    tmplt (...args: tmplt_arg_t): W_SinProxy_t { return Q_template(...args); }
}();
