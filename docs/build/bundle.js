
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function self(fn) {
        return function (event) {
            // @ts-ignore
            if (event.target === this)
                fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var MaterialType;
    (function (MaterialType) {
        MaterialType[MaterialType["Simple"] = 0] = "Simple";
        MaterialType[MaterialType["Experience"] = 1] = "Experience";
        MaterialType[MaterialType["LocalSpecialty"] = 2] = "LocalSpecialty";
        MaterialType[MaterialType["MonsterDrop"] = 3] = "MonsterDrop";
        MaterialType[MaterialType["AscensionGem"] = 4] = "AscensionGem";
        MaterialType[MaterialType["Ascention"] = 5] = "Ascention";
        MaterialType[MaterialType["ExperienceGroup"] = 6] = "ExperienceGroup";
        MaterialType[MaterialType["WeeklyBoss"] = 7] = "WeeklyBoss";
    })(MaterialType || (MaterialType = {}));

    function isSimpleTalent(talent) {
        return 'monsterGroup' in talent;
    }

    /* src\components\Icon.svelte generated by Svelte v3.55.1 */

    const file$c = "src\\components\\Icon.svelte";

    function create_fragment$c(ctx) {
    	let svg;
    	let g0;
    	let g1;
    	let g2;
    	let path;
    	let svg_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			path = svg_element("path");
    			attr_dev(g0, "id", "SVGRepo_bgCarrier");
    			attr_dev(g0, "stroke-width", "0");
    			add_location(g0, file$c, 29, 4, 2097);
    			attr_dev(g1, "id", "SVGRepo_tracerCarrier");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			add_location(g1, file$c, 30, 4, 2148);
    			attr_dev(path, "d", /*data*/ ctx[3]);
    			attr_dev(path, "stroke", /*stroke*/ ctx[0]);
    			attr_dev(path, "stroke-width", "1.5");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			add_location(path, file$c, 35, 8, 2298);
    			attr_dev(g2, "id", "SVGRepo_iconCarrier");
    			add_location(g2, file$c, 34, 4, 2260);
    			attr_dev(svg, "class", svg_class_value = /*$$props*/ ctx[4]["class"]);
    			attr_dev(svg, "fill", /*fill*/ ctx[1]);
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[2]);
    			set_style(svg, "height", /*size*/ ctx[2]);
    			add_location(svg, file$c, 21, 0, 1916);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g0);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(g2, path);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 8) {
    				attr_dev(path, "d", /*data*/ ctx[3]);
    			}

    			if (dirty & /*stroke*/ 1) {
    				attr_dev(path, "stroke", /*stroke*/ ctx[0]);
    			}

    			if (dirty & /*$$props*/ 16 && svg_class_value !== (svg_class_value = /*$$props*/ ctx[4]["class"])) {
    				attr_dev(svg, "class", svg_class_value);
    			}

    			if (dirty & /*fill*/ 2) {
    				attr_dev(svg, "fill", /*fill*/ ctx[1]);
    			}

    			if (dirty & /*size*/ 4) {
    				set_style(svg, "width", /*size*/ ctx[2]);
    			}

    			if (dirty & /*size*/ 4) {
    				set_style(svg, "height", /*size*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const PATH_DATA = {
    	refresh: "M3 3V9M3 9H9M3 9C5.32744 6.91141 7.48287 4.54676 10.7453 4.08779C12.6777 3.81593 14.6461 4.17941 16.3539 5.12343C18.0617 6.06746 19.4164 7.54091 20.2139 9.32177M21 21V15M21 15H15M21 15C18.6725 17.0886 16.5171 19.4532 13.2547 19.9122C11.3223 20.1841 9.35391 19.8206 7.6461 18.8766C5.93829 17.9325 4.58356 16.4591 3.78604 14.6782",
    	"menu-hamburger": "M4 17H20M4 12H20M4 7H20",
    	"edit-4": "M14 6L8 12V16H12L18 10M14 6L17 3L21 7L18 10M14 6L18 10M10 4L4 4L4 20L20 20V14",
    	"user-question": "M20.9532 13V12.995M19 7.4C19.2608 6.58858 20.0366 6 20.9531 6C22.0836 6 23 6.89543 23 8C23 9.60675 21.2825 8.81678 21 10.5M8 15H16C18.2091 15 20 16.7909 20 19V21H4V19C4 16.7909 5.79086 15 8 15ZM16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z",
    	undo: "M4 9V15M4 15H10M4 15C6.32744 12.9114 8.48287 10.5468 11.7453 10.0878C13.6777 9.81593 15.6461 10.1794 17.3539 11.1234C19.0617 12.0675 20.4164 13.5409 21.2139 15.3218",
    	"trash-2": "M10 10V16M14 10V16M18 6V18C18 19.1046 17.1046 20 16 20H8C6.89543 20 6 19.1046 6 18V6M4 6H20M15 6V5C15 3.89543 14.1046 3 13 3H11C9.89543 3 9 3.89543 9 5V6",
    	cross: "M19 5L5 19M5.00001 5L19 19",
    	plus: "M4 12H20M12 4V20",
    	"user-plus": "M20 8.5V13.5M17.5 11H22.5M8 15H16C18.2091 15 20 16.7909 20 19V21H4V19C4 16.7909 5.79086 15 8 15ZM16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z",
    	"document-plus": "M12 11V14M12 14V17M12 14H9M12 14H15M13 3H5V21H19V9M13 3H14L19 8V9M13 3V7C13 8 14 9 15 9H19"
    };

    function instance$c($$self, $$props, $$invalidate) {
    	let data;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Icon', slots, []);
    	let { icon } = $$props;
    	let { stroke = "var(--foreground-color)" } = $$props;
    	let { fill = "none" } = $$props;
    	let { size = null } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (icon === undefined && !('icon' in $$props || $$self.$$.bound[$$self.$$.props['icon']])) {
    			console.warn("<Icon> was created without expected prop 'icon'");
    		}
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('icon' in $$new_props) $$invalidate(5, icon = $$new_props.icon);
    		if ('stroke' in $$new_props) $$invalidate(0, stroke = $$new_props.stroke);
    		if ('fill' in $$new_props) $$invalidate(1, fill = $$new_props.fill);
    		if ('size' in $$new_props) $$invalidate(2, size = $$new_props.size);
    	};

    	$$self.$capture_state = () => ({
    		PATH_DATA,
    		icon,
    		stroke,
    		fill,
    		size,
    		data
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), $$new_props));
    		if ('icon' in $$props) $$invalidate(5, icon = $$new_props.icon);
    		if ('stroke' in $$props) $$invalidate(0, stroke = $$new_props.stroke);
    		if ('fill' in $$props) $$invalidate(1, fill = $$new_props.fill);
    		if ('size' in $$props) $$invalidate(2, size = $$new_props.size);
    		if ('data' in $$props) $$invalidate(3, data = $$new_props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon*/ 32) {
    			$$invalidate(3, data = PATH_DATA[icon]);
    		}
    	};

    	$$props = exclude_internal_props($$props);
    	return [stroke, fill, size, data, $$props, icon, click_handler];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { icon: 5, stroke: 0, fill: 1, size: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get icon() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stroke() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stroke(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fill() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\AutocompleteInput.svelte generated by Svelte v3.55.1 */

    const { document: document_1 } = globals;
    const file$b = "src\\components\\AutocompleteInput.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    // (124:8) {#each filtered_list as item, i (item)}
    function create_each_block$6(key_1, ctx) {
    	let button;
    	let span;
    	let t0_value = /*item*/ ctx[20].substring(0, /*value*/ ctx[0].length) + "";
    	let t0;
    	let t1_value = /*item*/ ctx[20].substring(/*value*/ ctx[0].length) + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[14](/*item*/ ctx[20]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "class", "svelte-f6zyt5");
    			add_location(span, file$b, 132, 16, 3913);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "tabindex", "-1");
    			attr_dev(button, "class", "svelte-f6zyt5");
    			toggle_class(button, "active", /*i*/ ctx[22] === /*selected_index*/ ctx[4]);
    			add_location(button, file$b, 124, 12, 3631);
    			this.first = button;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);
    			append_dev(span, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", stop_propagation(click_handler), false, false, true);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*filtered_list, value*/ 129 && t0_value !== (t0_value = /*item*/ ctx[20].substring(0, /*value*/ ctx[0].length) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*filtered_list, value*/ 129 && t1_value !== (t1_value = /*item*/ ctx[20].substring(/*value*/ ctx[0].length) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*filtered_list, selected_index*/ 144) {
    				toggle_class(button, "active", /*i*/ ctx[22] === /*selected_index*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(124:8) {#each filtered_list as item, i (item)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let t0;
    	let div1;
    	let input;
    	let t1;
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let mounted;
    	let dispose;
    	let each_value = /*filtered_list*/ ctx[7];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[20];
    	validate_each_keys(ctx, each_value, get_each_context$6, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$6(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$6(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			t0 = space();
    			div1 = element("div");
    			input = element("input");
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			attr_dev(input, "name", /*name*/ ctx[2]);
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "class", "svelte-f6zyt5");
    			add_location(input, file$b, 106, 4, 3154);
    			attr_dev(div0, "class", "dialog svelte-f6zyt5");
    			toggle_class(div0, "open", /*open*/ ctx[6] && /*filtered_list*/ ctx[7].length > 0);
    			add_location(div0, file$b, 119, 4, 3456);
    			attr_dev(div1, "class", "wrapper svelte-f6zyt5");
    			add_location(div1, file$b, 98, 0, 2978);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input);
    			set_input_value(input, /*value*/ ctx[0]);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			/*div0_binding*/ ctx[15](div0);
    			/*div1_binding*/ ctx[16](div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(document_1.body, "click", /*checkTarget*/ ctx[10], false, false, false),
    					listen_dev(document_1.body, "focus", /*checkTarget*/ ctx[10], true, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[12]),
    					listen_dev(input, "keydown", /*checkForSelection*/ ctx[8], false, false, false),
    					listen_dev(input, "focus", /*focus_handler*/ ctx[13], false, false, false),
    					listen_dev(div1, "focusout", focusout_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*placeholder*/ 2) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			}

    			if (dirty & /*name*/ 4) {
    				attr_dev(input, "name", /*name*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}

    			if (dirty & /*filtered_list, selected_index, value, open*/ 209) {
    				each_value = /*filtered_list*/ ctx[7];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$6, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, destroy_block, create_each_block$6, null, get_each_context$6);
    			}

    			if (dirty & /*open, filtered_list*/ 192) {
    				toggle_class(div0, "open", /*open*/ ctx[6] && /*filtered_list*/ ctx[7].length > 0);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*div0_binding*/ ctx[15](null);
    			/*div1_binding*/ ctx[16](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const focusout_handler = e => {
    	
    }; // console.log
    // open = false;

    function instance$b($$self, $$props, $$invalidate) {
    	let filtered_list;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AutocompleteInput', slots, []);
    	let { items } = $$props;
    	let { value = "" } = $$props;
    	let { placeholder = undefined } = $$props;
    	let { name = undefined } = $$props;
    	let wrapper;
    	let dialog;
    	let open = false;
    	let selected_index = null;

    	function moveNext() {
    		if (selected_index == null) {
    			$$invalidate(4, selected_index = 0);
    			return;
    		}

    		$$invalidate(4, selected_index = (selected_index + 1) % filtered_list.length);
    	}

    	function movePrevious() {
    		if (selected_index == null) {
    			$$invalidate(4, selected_index = filtered_list.length - 1);
    			return;
    		}

    		$$invalidate(4, selected_index = (selected_index + filtered_list.length - 1) % filtered_list.length);
    	}

    	function checkForSelection(event) {
    		if (event.isComposing || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;

    		if (event.key === "ArrowDown") {
    			moveNext();
    			event.preventDefault();
    		} else if (event.key === "ArrowUp") {
    			movePrevious();
    			event.preventDefault();
    		} else if (event.key === "Escape") {
    			$$invalidate(6, open = false);
    			event.preventDefault();
    		} else if (event.key === "Enter") {
    			$$invalidate(0, value = filtered_list[selected_index !== null && selected_index !== void 0
    			? selected_index
    			: 0]);

    			$$invalidate(6, open = false);
    			event.preventDefault();
    		} else if (event.key === "Tab") {
    			$$invalidate(6, open = false);
    		}
    	}

    	function checkDialogPosition() {
    		const bodyRect = document.body.getBoundingClientRect();
    		const dialogRect = dialog.getBoundingClientRect();
    		const inputRect = wrapper.getBoundingClientRect();

    		if (inputRect.bottom + dialogRect.height <= bodyRect.height) {
    			$$invalidate(3, dialog.style.top = inputRect.bottom + "", dialog);
    		} else {
    			$$invalidate(3, dialog.style.bottom = inputRect.top + "", dialog);
    		}

    		if (inputRect.left + dialogRect.width <= bodyRect.width) {
    			$$invalidate(3, dialog.style.left = inputRect.left + "", dialog);
    		} else {
    			$$invalidate(3, dialog.style.right = inputRect.right + "", dialog);
    		}
    	}

    	function checkInputValidity() {
    		const input = wrapper.firstElementChild;

    		if (!items.includes(value)) {
    			input.setCustomValidity("Input does not match any valid value");
    		} else {
    			input.setCustomValidity("");
    		}
    	}

    	function checkTarget(e) {
    		$$invalidate(6, open = wrapper.contains(e.target));
    	}

    	$$self.$$.on_mount.push(function () {
    		if (items === undefined && !('items' in $$props || $$self.$$.bound[$$self.$$.props['items']])) {
    			console.warn("<AutocompleteInput> was created without expected prop 'items'");
    		}
    	});

    	const writable_props = ['items', 'value', 'placeholder', 'name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AutocompleteInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	const focus_handler = () => {
    		$$invalidate(6, open = true);
    		checkDialogPosition();
    		$$invalidate(4, selected_index = null);
    	};

    	const click_handler = item => {
    		$$invalidate(0, value = item);
    		$$invalidate(6, open = false);
    	};

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			dialog = $$value;
    			$$invalidate(3, dialog);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapper = $$value;
    			$$invalidate(5, wrapper);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('items' in $$props) $$invalidate(11, items = $$props.items);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		items,
    		value,
    		placeholder,
    		name,
    		wrapper,
    		dialog,
    		open,
    		selected_index,
    		moveNext,
    		movePrevious,
    		checkForSelection,
    		checkDialogPosition,
    		checkInputValidity,
    		checkTarget,
    		filtered_list
    	});

    	$$self.$inject_state = $$props => {
    		if ('items' in $$props) $$invalidate(11, items = $$props.items);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('wrapper' in $$props) $$invalidate(5, wrapper = $$props.wrapper);
    		if ('dialog' in $$props) $$invalidate(3, dialog = $$props.dialog);
    		if ('open' in $$props) $$invalidate(6, open = $$props.open);
    		if ('selected_index' in $$props) $$invalidate(4, selected_index = $$props.selected_index);
    		if ('filtered_list' in $$props) $$invalidate(7, filtered_list = $$props.filtered_list);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*items, value*/ 2049) {
    			$$invalidate(7, filtered_list = items.filter(i => i.startsWith(value)));
    		}

    		if ($$self.$$.dirty & /*dialog, selected_index*/ 24) {
    			{
    				if (dialog != null && selected_index != null) {
    					const child = dialog.children.item(selected_index);

    					if (child.offsetTop < dialog.scrollTop) {
    						child.scrollIntoView({ block: "center", inline: "center" });
    					} else if (child.offsetTop + child.clientHeight > dialog.scrollTop + dialog.clientHeight) {
    						child.scrollIntoView({ block: "center", inline: "center" });
    					}
    				}
    			}
    		}
    	};

    	return [
    		value,
    		placeholder,
    		name,
    		dialog,
    		selected_index,
    		wrapper,
    		open,
    		filtered_list,
    		checkForSelection,
    		checkDialogPosition,
    		checkTarget,
    		items,
    		input_input_handler,
    		focus_handler,
    		click_handler,
    		div0_binding,
    		div1_binding
    	];
    }

    class AutocompleteInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			items: 11,
    			value: 0,
    			placeholder: 1,
    			name: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AutocompleteInput",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get items() {
    		throw new Error("<AutocompleteInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<AutocompleteInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<AutocompleteInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<AutocompleteInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<AutocompleteInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<AutocompleteInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<AutocompleteInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<AutocompleteInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var levelBarriers=[20,40,50,60,70,80,90];var items=[{id:0,name:"Mora",image:"images/items/mora.png",stars:3,quantity:20000},{id:9,name:"Wanderer's Advice",image:"images/items/wanderer_s_advice.png",stars:2,experience:1000},{id:17,name:"Adventurer's Experience",image:"images/items/adventurer_s_experience.png",stars:3,experience:5000},{id:25,name:"Hero's Wit",image:"images/items/hero_s_wit.png",stars:4,experience:20000},{id:38,expToMoraRate:5,group:"Character Experience Material",tiers:{low:9,medium:17,high:25}},{id:41,name:"Enhancement Ore",image:"images/items/enhancement_ore.png",stars:1,experience:400},{id:49,name:"Fine Enhancement Ore",image:"images/items/fine_enhancement_ore.png",stars:2,experience:2000},{id:57,name:"Mystic Enhancement Ore",image:"images/items/mystic_enhancement_ore.png",stars:3,experience:10000},{id:70,expToMoraRate:10,group:"Weapon Experience Material",tiers:{low:41,medium:49,high:57}},{id:74,name:"Calla Lily",image:"images/items/calla_lily.png",stars:0,region:"Mondstadt"},{id:82,name:"Wolfhook",image:"images/items/wolfhook.png",stars:0,region:"Mondstadt"},{id:90,name:"Valberry",image:"images/items/valberry.png",stars:0,region:"Mondstadt"},{id:98,name:"Cecilia",image:"images/items/cecilia.png",stars:0,region:"Mondstadt"},{id:106,name:"Windwheel Aster",image:"images/items/windwheel_aster.png",stars:0,region:"Mondstadt"},{id:114,name:"Philanemo Mushroom",image:"images/items/philanemo_mushroom.png",stars:0,region:"Mondstadt"},{id:122,name:"Small Lamp Grass",image:"images/items/small_lamp_grass.png",stars:0,region:"Mondstadt"},{id:130,name:"Dandelion Seed",image:"images/items/dandelion_seed.png",stars:0,region:"Mondstadt"},{id:138,name:"Jueyun Chili",image:"images/items/jueyun_chili.png",stars:0,region:"Liyue"},{id:146,name:"Noctilucous Jade",image:"images/items/noctilucous_jade.png",stars:0,region:"Liyue"},{id:154,name:"Silk Flower",image:"images/items/silk_flower.png",stars:0,region:"Liyue"},{id:162,name:"Glaze Lily",image:"images/items/glaze_lily.png",stars:0,region:"Liyue"},{id:170,name:"Qingxin",image:"images/items/qingxin.png",stars:0,region:"Liyue"},{id:178,name:"Starconch",image:"images/items/starconch.png",stars:0,region:"Liyue"},{id:186,name:"Violetgrass",image:"images/items/violetgrass.png",stars:0,region:"Liyue"},{id:194,name:"Cor Lapis",image:"images/items/cor_lapis.png",stars:0,region:"Liyue"},{id:202,name:"Onikabuto",image:"images/items/onikabuto.png",stars:0,region:"Inazuma"},{id:210,name:"Sakura Bloom",image:"images/items/sakura_bloom.png",stars:0,region:"Inazuma"},{id:218,name:"Crystal Marrow",image:"images/items/crystal_marrow.png",stars:0,region:"Inazuma"},{id:226,name:"Dendrobium",image:"images/items/dendrobium.png",stars:0,region:"Inazuma"},{id:234,name:"Naku Weed",image:"images/items/naku_weed.png",stars:0,region:"Inazuma"},{id:242,name:"Sea Ganoderma",image:"images/items/sea_ganoderma.png",stars:0,region:"Inazuma"},{id:250,name:"Sango Pearl",image:"images/items/sango_pearl.png",stars:0,region:"Inazuma"},{id:258,name:"Amakumo Fruit",image:"images/items/amakumo_fruit.png",stars:0,region:"Inazuma"},{id:266,name:"Fluorescent Fungus",image:"images/items/fluorescent_fungus.png",stars:0,region:"Inazuma"},{id:274,name:"Rukkhashava Mushrooms",image:"images/items/rukkhashava_mushrooms.png",stars:0,region:"Sumeru"},{id:282,name:"Padisarah",image:"images/items/padisarah.png",stars:0,region:"Sumeru"},{id:290,name:"Nilotpala Lotus",image:"images/items/nilotpala_lotus.png",stars:0,region:"Sumeru"},{id:298,name:"Kalpalata Lotus",image:"images/items/kalpalata_lotus.png",stars:0,region:"Sumeru"},{id:304,name:"Hurricane Seed",image:"images/items/hurricane_seed.png",stars:4},{id:312,name:"Lightning Prism",image:"images/items/lightning_prism.png",stars:4},{id:320,name:"Basalt Pillar",image:"images/items/basalt_pillar.png",stars:4},{id:328,name:"Hoarfrost Core",image:"images/items/hoarfrost_core.png",stars:4},{id:336,name:"Everflame Seed",image:"images/items/everflame_seed.png",stars:4},{id:344,name:"Cleansing Heart",image:"images/items/cleansing_heart.png",stars:4},{id:352,name:"Juvenile Jade",image:"images/items/juvenile_jade.png",stars:4},{id:360,name:"Crystalline Bloom",image:"images/items/crystalline_bloom.png",stars:4},{id:368,name:"Marionette Core",image:"images/items/marionette_core.png",stars:4},{id:376,name:"Perpetual Heart",image:"images/items/perpetual_heart.png",stars:4},{id:384,name:"Smoldering Pearl",image:"images/items/smoldering_pearl.png",stars:4},{id:392,name:"Dew of Repudiation",image:"images/items/dew_of_repudiation.png",stars:4},{id:400,name:"Storm Beads",image:"images/items/storm_beads.png",stars:4},{id:408,name:"Riftborn Regalia",image:"images/items/riftborn_regalia.png",stars:4},{id:416,name:"Dragonheir's False Fin",image:"images/items/dragonheir_s_false_fin.png",stars:4},{id:424,name:"Runic Fang",image:"images/items/runic_fang.png",stars:4},{id:432,name:"Majestic Hooked Beak",image:"images/items/majestic_hooked_beak.png",stars:4},{id:440,name:"Thunderclap Fruitcore",image:"images/items/thunderclap_fruitcore.png",stars:4},{id:448,name:"Brilliant Diamond Sliver",image:"images/items/brilliant_diamond_sliver.png",stars:2},{id:456,name:"Brilliant Diamond Fragment",image:"images/items/brilliant_diamond_fragment.png",stars:3},{id:464,name:"Brilliant Diamond Chunk",image:"images/items/brilliant_diamond_chunk.png",stars:4},{id:472,name:"Brilliant Diamond Gemstone",image:"images/items/brilliant_diamond_gemstone.png",stars:5},{id:484,group:"Traveler Traveler",tiers:{low:448,medium:456,high:464,highest:472}},{id:488,name:"Agnidus Agate Sliver",image:"images/items/agnidus_agate_sliver.png",stars:2},{id:496,name:"Agnidus Agate Fragment",image:"images/items/agnidus_agate_fragment.png",stars:3},{id:504,name:"Agnidus Agate Chunk",image:"images/items/agnidus_agate_chunk.png",stars:4},{id:512,name:"Agnidus Agate Gemstone",image:"images/items/agnidus_agate_gemstone.png",stars:5},{id:524,group:"Pyro Characters",element:"Pyro",tiers:{low:488,medium:496,high:504,highest:512}},{id:528,name:"Varunada Lazurite Sliver",image:"images/items/varunada_lazurite_sliver.png",stars:2},{id:536,name:"Varunada Lazurite Fragment",image:"images/items/varunada_lazurite_fragment.png",stars:3},{id:544,name:"Varunada Lazurite Chunk",image:"images/items/varunada_lazurite_chunk.png",stars:4},{id:552,name:"Varunada Lazurite Gemstone",image:"images/items/varunada_lazurite_gemstone.png",stars:5},{id:564,group:"Hydro Characters",element:"Hydro",tiers:{low:528,medium:536,high:544,highest:552}},{id:568,name:"Nagadus Emerald Sliver",image:"images/items/nagadus_emerald_sliver.png",stars:2},{id:576,name:"Nagadus Emerald Fragment",image:"images/items/nagadus_emerald_fragment.png",stars:3},{id:584,name:"Nagadus Emerald Chunk",image:"images/items/nagadus_emerald_chunk.png",stars:4},{id:592,name:"Nagadus Emerald Gemstone",image:"images/items/nagadus_emerald_gemstone.png",stars:5},{id:604,group:"Dendro Characters",element:"Dendro",tiers:{low:568,medium:576,high:584,highest:592}},{id:608,name:"Vajrada Amethyst Sliver",image:"images/items/vajrada_amethyst_sliver.png",stars:2},{id:616,name:"Vajrada Amethyst Fragment",image:"images/items/vajrada_amethyst_fragment.png",stars:3},{id:624,name:"Vajrada Amethyst Chunk",image:"images/items/vajrada_amethyst_chunk.png",stars:4},{id:632,name:"Vajrada Amethyst Gemstone",image:"images/items/vajrada_amethyst_gemstone.png",stars:5},{id:644,group:"Electro Characters",element:"Electro",tiers:{low:608,medium:616,high:624,highest:632}},{id:648,name:"Vayuda Turquoise Sliver",image:"images/items/vayuda_turquoise_sliver.png",stars:2},{id:656,name:"Vayuda Turquoise Fragment",image:"images/items/vayuda_turquoise_fragment.png",stars:3},{id:664,name:"Vayuda Turquoise Chunk",image:"images/items/vayuda_turquoise_chunk.png",stars:4},{id:672,name:"Vayuda Turquoise Gemstone",image:"images/items/vayuda_turquoise_gemstone.png",stars:5},{id:684,group:"Anemo Characters",element:"Anemo",tiers:{low:648,medium:656,high:664,highest:672}},{id:688,name:"Shivada Jade Sliver",image:"images/items/shivada_jade_sliver.png",stars:2},{id:696,name:"Shivada Jade Fragment",image:"images/items/shivada_jade_fragment.png",stars:3},{id:704,name:"Shivada Jade Chunk",image:"images/items/shivada_jade_chunk.png",stars:4},{id:712,name:"Shivada Jade Gemstone",image:"images/items/shivada_jade_gemstone.png",stars:5},{id:724,group:"Cryo Characters",element:"Cryo",tiers:{low:688,medium:696,high:704,highest:712}},{id:728,name:"Prithiva Topaz Sliver",image:"images/items/prithiva_topaz_sliver.png",stars:2},{id:736,name:"Prithiva Topaz Fragment",image:"images/items/prithiva_topaz_fragment.png",stars:3},{id:744,name:"Prithiva Topaz Chunk",image:"images/items/prithiva_topaz_chunk.png",stars:4},{id:752,name:"Prithiva Topaz Gemstone",image:"images/items/prithiva_topaz_gemstone.png",stars:5},{id:764,group:"Geo Characters",element:"Geo",tiers:{low:728,medium:736,high:744,highest:752}},{id:768,name:"Slime Condensate",image:"images/items/slime_condensate.png",stars:1},{id:776,name:"Slime Secretions",image:"images/items/slime_secretions.png",stars:2},{id:784,name:"Slime Concentrate",image:"images/items/slime_concentrate.png",stars:3},{id:795,enemies:["Slimes"],group:"Slime Slimes",tiers:{low:768,medium:776,high:784}},{id:800,name:"Damaged Mask",image:"images/items/damaged_mask.png",stars:1},{id:808,name:"Stained Mask",image:"images/items/stained_mask.png",stars:2},{id:816,name:"Ominous Mask",image:"images/items/ominous_mask.png",stars:3},{id:827,enemies:["Hilichurls","Samachurls","Mitachurls","Lawachurls"],group:"Hilichurl Masks",tiers:{low:800,medium:808,high:816}},{id:832,name:"Divining Scroll",image:"images/items/divining_scroll.png",stars:1},{id:840,name:"Sealed Scroll",image:"images/items/sealed_scroll.png",stars:2},{id:848,name:"Forbidden Curse Scroll",image:"images/items/forbidden_curse_scroll.png",stars:3},{id:859,enemies:["Samachurls"],group:"Samachurl Scrolls",tiers:{low:832,medium:840,high:848}},{id:864,name:"Firm Arrowhead",image:"images/items/firm_arrowhead.png",stars:1},{id:872,name:"Sharp Arrowhead",image:"images/items/sharp_arrowhead.png",stars:2},{id:880,name:"Weathered Arrowhead",image:"images/items/weathered_arrowhead.png",stars:3},{id:891,enemies:["Hilichurl Shooters"],group:"Hilichurl Arrowheads",tiers:{low:864,medium:872,high:880}},{id:896,name:"Recruit's Insignia",image:"images/items/recruit_s_insignia.png",stars:1},{id:904,name:"Sergeant's Insignia",image:"images/items/sergeant_s_insignia.png",stars:2},{id:912,name:"Lieutenant's Insignia",image:"images/items/lieutenant_s_insignia.png",stars:3},{id:923,enemies:["Fatui Skirmishers","Fatui Cicin Mages","Fatui Pyro Agent"],group:"Fatui Insignia",tiers:{low:896,medium:904,high:912}},{id:928,name:"Treasure Hoarder Insignia",image:"images/items/treasure_hoarder_insignia.png",stars:1},{id:936,name:"Silver Raven Insignia",image:"images/items/silver_raven_insignia.png",stars:2},{id:944,name:"Golden Raven Insignia",image:"images/items/golden_raven_insignia.png",stars:3},{id:955,enemies:["Treasure Hoarders"],group:"Treasure Hoarder Insignias",tiers:{low:928,medium:936,high:944}},{id:960,name:"Whopperflower Nectar",image:"images/items/whopperflower_nectar.png",stars:1},{id:968,name:"Shimmering Nectar",image:"images/items/shimmering_nectar.png",stars:2},{id:976,name:"Energy Nectar",image:"images/items/energy_nectar.png",stars:3},{id:987,enemies:["Whopperflowers"],group:"Whopperflower Nectars",tiers:{low:960,medium:968,high:976}},{id:992,name:"Old Handguard",image:"images/items/old_handguard.png",stars:1},{id:1000,name:"Kageuchi Handguard",image:"images/items/kageuchi_handguard.png",stars:2},{id:1008,name:"Famed Handguard",image:"images/items/famed_handguard.png",stars:3},{id:1019,enemies:["Nobushi","Kairagi"],group:"Nobushi Handguards",tiers:{low:992,medium:1000,high:1008}},{id:1024,name:"Spectral Husk",image:"images/items/spectral_husk.png",stars:1},{id:1032,name:"Spectral Heart",image:"images/items/spectral_heart.png",stars:2},{id:1040,name:"Spectral Nucleus",image:"images/items/spectral_nucleus.png",stars:3},{id:1051,enemies:["Specters"],group:"Spectral Cores",tiers:{low:1024,medium:1032,high:1040}},{id:1056,name:"Fungal Spores",image:"images/items/fungal_spores.png",stars:1},{id:1064,name:"Luminescent Pollen",image:"images/items/luminescent_pollen.png",stars:2},{id:1072,name:"Crystalline Cyst Dust",image:"images/items/crystalline_cyst_dust.png",stars:3},{id:1083,enemies:["Fungi"],group:"Fungal Spore Powder",tiers:{low:1056,medium:1064,high:1072}},{id:1088,name:"Faded Red Satin",image:"images/items/faded_red_satin.png",stars:1},{id:1096,name:"Trimmed Red Silk",image:"images/items/trimmed_red_silk.png",stars:2},{id:1104,name:"Rich Red Brocade",image:"images/items/rich_red_brocade.png",stars:3},{id:1115,enemies:["The Eremites"],group:"Red Cloth",tiers:{low:1088,medium:1096,high:1104}},{id:1120,name:"Heavy Horn",image:"images/items/heavy_horn.png",stars:2},{id:1128,name:"Black Bronze Horn",image:"images/items/black_bronze_horn.png",stars:3},{id:1136,name:"Black Crystal Horn",image:"images/items/black_crystal_horn.png",stars:4},{id:1147,enemies:["Mitachurls","Lawachurls"],group:"Hilichurl Horns",tiers:{low:1120,medium:1128,high:1136}},{id:1152,name:"Dead Ley Line Branch",image:"images/items/dead_ley_line_branch.png",stars:2},{id:1160,name:"Dead Ley Line Leaves",image:"images/items/dead_ley_line_leaves.png",stars:3},{id:1168,name:"Ley Line Sprout",image:"images/items/ley_line_sprout.png",stars:4},{id:1179,enemies:["Abyss Mages","Abyss Heralds","Abyss Lectors"],group:"Ley Line Branches",tiers:{low:1152,medium:1160,high:1168}},{id:1184,name:"Chaos Device",image:"images/items/chaos_device.png",stars:2},{id:1192,name:"Chaos Circuit",image:"images/items/chaos_circuit.png",stars:3},{id:1200,name:"Chaos Core",image:"images/items/chaos_core.png",stars:4},{id:1211,enemies:["Ruin Guard","Ruin Hunter","Ruin Grader"],group:"Chaos Parts",tiers:{low:1184,medium:1192,high:1200}},{id:1216,name:"Mist Grass Pollen",image:"images/items/mist_grass_pollen.png",stars:2},{id:1224,name:"Mist Grass",image:"images/items/mist_grass.png",stars:3},{id:1232,name:"Mist Grass Wick",image:"images/items/mist_grass_wick.png",stars:4},{id:1243,enemies:["Fatui Cicin Mages"],group:"Mist Grasses",tiers:{low:1216,medium:1224,high:1232}},{id:1248,name:"Hunter's Sacrificial Knife",image:"images/items/hunter_s_sacrificial_knife.png",stars:2},{id:1256,name:"Agent's Sacrificial Knife",image:"images/items/agent_s_sacrificial_knife.png",stars:3},{id:1264,name:"Inspector's Sacrificial Knife",image:"images/items/inspector_s_sacrificial_knife.png",stars:4},{id:1275,enemies:["Fatui Pyro Agent"],group:"Sacrificial Knives",tiers:{low:1248,medium:1256,high:1264}},{id:1280,name:"Fragile Bone Shard",image:"images/items/fragile_bone_shard.png",stars:2},{id:1288,name:"Sturdy Bone Shard",image:"images/items/sturdy_bone_shard.png",stars:3},{id:1296,name:"Fossilized Bone Shard",image:"images/items/fossilized_bone_shard.png",stars:4},{id:1307,enemies:["Geovishap Hatchling","Geovishap","Bathysmal Vishaps"],group:"Bone Shards",tiers:{low:1280,medium:1288,high:1296}},{id:1312,name:"Chaos Gear",image:"images/items/chaos_gear.png",stars:2},{id:1320,name:"Chaos Axis",image:"images/items/chaos_axis.png",stars:3},{id:1328,name:"Chaos Oculus",image:"images/items/chaos_oculus.png",stars:4},{id:1339,enemies:["Ruin Sentinels"],group:"Sentinel Chaos Parts",tiers:{low:1312,medium:1320,high:1328}},{id:1344,name:"Dismal Prism",image:"images/items/dismal_prism.png",stars:2},{id:1352,name:"Crystal Prism",image:"images/items/crystal_prism.png",stars:3},{id:1360,name:"Polarizing Prism",image:"images/items/polarizing_prism.png",stars:4},{id:1371,enemies:["Mirror Maiden"],group:"Prisms",tiers:{low:1344,medium:1352,high:1360}},{id:1376,name:"Concealed Claw",image:"images/items/concealed_claw.png",stars:2},{id:1384,name:"Concealed Unguis",image:"images/items/concealed_unguis.png",stars:3},{id:1392,name:"Concealed Talon",image:"images/items/concealed_talon.png",stars:4},{id:1403,enemies:["Riftwolves"],group:"Concealed Riftwolf Claws",tiers:{low:1376,medium:1384,high:1392}},{id:1408,name:"Gloomy Statuette",image:"images/items/gloomy_statuette.png",stars:2},{id:1416,name:"Dark Statuette",image:"images/items/dark_statuette.png",stars:3},{id:1424,name:"Deathly Statuette",image:"images/items/deathly_statuette.png",stars:4},{id:1435,enemies:["Abyss Heralds","Abyss Lectors","The Black Serpents"],group:"Statuettes",tiers:{low:1408,medium:1416,high:1424}},{id:1440,name:"Inactivated Fungal Nucleus",image:"images/items/inactivated_fungal_nucleus.png",stars:2},{id:1448,name:"Dormant Fungal Nucleus",image:"images/items/dormant_fungal_nucleus.png",stars:3},{id:1456,name:"Robust Fungal Nucleus",image:"images/items/robust_fungal_nucleus.png",stars:4},{id:1467,enemies:["Fungi (Scorched and Activated)"],group:"Fungal Nuclei",tiers:{low:1440,medium:1448,high:1456}},{id:1472,name:"Chaos Storage",image:"images/items/chaos_storage.png",stars:2},{id:1480,name:"Chaos Module",image:"images/items/chaos_module.png",stars:3},{id:1488,name:"Chaos Bolt",image:"images/items/chaos_bolt.png",stars:4},{id:1499,enemies:["Ruin Drakes"],group:"Drake Chaos Parts",tiers:{low:1472,medium:1480,high:1488}},{id:1504,name:"Crown of Insight",image:"images/items/crown_of_insight.png",stars:5},{id:1512,name:"Teachings of Freedom",image:"images/items/teachings_of_freedom.png",stars:2},{id:1520,name:"Guide to Freedom",image:"images/items/guide_to_freedom.png",stars:3},{id:1528,name:"Philosophies of Freedom",image:"images/items/philosophies_of_freedom.png",stars:4},{id:1541,days:"Monday/Thursday/Sunday",region:"Mondstadt",temple:"Forsaken Rift",group:"Freedom Books",tiers:{low:1512,medium:1520,high:1528}},{id:1544,name:"Teachings of Resistance",image:"images/items/teachings_of_resistance.png",stars:2},{id:1552,name:"Guide to Resistance",image:"images/items/guide_to_resistance.png",stars:3},{id:1560,name:"Philosophies of Resistance",image:"images/items/philosophies_of_resistance.png",stars:4},{id:1573,days:"Tuesday/Friday/Sunday",region:"Mondstadt",temple:"Forsaken Rift",group:"Resistance Books",tiers:{low:1544,medium:1552,high:1560}},{id:1576,name:"Teachings of Ballad",image:"images/items/teachings_of_ballad.png",stars:2},{id:1584,name:"Guide to Ballad",image:"images/items/guide_to_ballad.png",stars:3},{id:1592,name:"Philosophies of Ballad",image:"images/items/philosophies_of_ballad.png",stars:4},{id:1605,days:"Wednesday/Saturday/Sunday",region:"Mondstadt",temple:"Forsaken Rift",group:"Ballad Books",tiers:{low:1576,medium:1584,high:1592}},{id:1608,name:"Teachings of Prosperity",image:"images/items/teachings_of_prosperity.png",stars:2},{id:1616,name:"Guide to Prosperity",image:"images/items/guide_to_prosperity.png",stars:3},{id:1624,name:"Philosophies of Prosperity",image:"images/items/philosophies_of_prosperity.png",stars:4},{id:1637,days:"Monday/Thursday/Sunday",region:"Liyue",temple:"Taishan Mansion",group:"Prosperity Books",tiers:{low:1608,medium:1616,high:1624}},{id:1640,name:"Teachings of Diligence",image:"images/items/teachings_of_diligence.png",stars:2},{id:1648,name:"Guide to Diligence",image:"images/items/guide_to_diligence.png",stars:3},{id:1656,name:"Philosophies of Diligence",image:"images/items/philosophies_of_diligence.png",stars:4},{id:1669,days:"Tuesday/Friday/Sunday",region:"Liyue",temple:"Taishan Mansion",group:"Diligence Books",tiers:{low:1640,medium:1648,high:1656}},{id:1672,name:"Teachings of Gold",image:"images/items/teachings_of_gold.png",stars:2},{id:1680,name:"Guide to Gold",image:"images/items/guide_to_gold.png",stars:3},{id:1688,name:"Philosophies of Gold",image:"images/items/philosophies_of_gold.png",stars:4},{id:1701,days:"Wednesday/Saturday/Sunday",region:"Liyue",temple:"Taishan Mansion",group:"Gold Books",tiers:{low:1672,medium:1680,high:1688}},{id:1704,name:"Teachings of Transience",image:"images/items/teachings_of_transience.png",stars:2},{id:1712,name:"Guide to Transience",image:"images/items/guide_to_transience.png",stars:3},{id:1720,name:"Philosophies of Transience",image:"images/items/philosophies_of_transience.png",stars:4},{id:1733,days:"Monday/Thursday/Sunday",region:"Inazuma",temple:"Violet Court",group:"Transience Books",tiers:{low:1704,medium:1712,high:1720}},{id:1736,name:"Teachings of Elegance",image:"images/items/teachings_of_elegance.png",stars:2},{id:1744,name:"Guide to Elegance",image:"images/items/guide_to_elegance.png",stars:3},{id:1752,name:"Philosophies of Elegance",image:"images/items/philosophies_of_elegance.png",stars:4},{id:1765,days:"Tuesday/Friday/Sunday",region:"Inazuma",temple:"Violet Court",group:"Elegance Books",tiers:{low:1736,medium:1744,high:1752}},{id:1768,name:"Teachings of Light",image:"images/items/teachings_of_light.png",stars:2},{id:1776,name:"Guide to Light",image:"images/items/guide_to_light.png",stars:3},{id:1784,name:"Philosophies of Light",image:"images/items/philosophies_of_light.png",stars:4},{id:1797,days:"Wednesday/Saturday/Sunday",region:"Inazuma",temple:"Violet Court",group:"Light Books",tiers:{low:1768,medium:1776,high:1784}},{id:1800,name:"Teachings of Admonition",image:"images/items/teachings_of_admonition.png",stars:2},{id:1808,name:"Guide to Admonition",image:"images/items/guide_to_admonition.png",stars:3},{id:1816,name:"Philosophies of Admonition",image:"images/items/philosophies_of_admonition.png",stars:4},{id:1829,days:"Monday/Thursday/Sunday",region:"Sumeru",temple:"Steeple of Ignorance",group:"Admonition Books",tiers:{low:1800,medium:1808,high:1816}},{id:1832,name:"Teachings of Ingenuity",image:"images/items/teachings_of_ingenuity.png",stars:2},{id:1840,name:"Guide to Ingenuity",image:"images/items/guide_to_ingenuity.png",stars:3},{id:1848,name:"Philosophies of Ingenuity",image:"images/items/philosophies_of_ingenuity.png",stars:4},{id:1861,days:"Tuesday/Friday/Sunday",region:"Sumeru",temple:"Steeple of Ignorance",group:"Ingenuity Books",tiers:{low:1832,medium:1840,high:1848}},{id:1864,name:"Teachings of Praxis",image:"images/items/teachings_of_praxis.png",stars:2},{id:1872,name:"Guide to Praxis",image:"images/items/guide_to_praxis.png",stars:3},{id:1880,name:"Philosophies of Praxis",image:"images/items/philosophies_of_praxis.png",stars:4},{id:1893,days:"Wednesday/Saturday/Sunday",region:"Sumeru",temple:"Steeple of Ignorance",group:"Praxis Books",tiers:{low:1864,medium:1872,high:1880}},{id:1896,name:"Dvalin's Plume",image:"images/items/dvalin_s_plume.png",stars:5},{id:1904,name:"Dvalin's Claw",image:"images/items/dvalin_s_claw.png",stars:5},{id:1912,name:"Dvalin's Sigh",image:"images/items/dvalin_s_sigh.png",stars:5},{id:1927,name:"Dvalin",image:"images/items/dvalin.png",materials:[1896,1904,1912]},{id:1928,name:"Tail of Boreas",image:"images/items/tail_of_boreas.png",stars:5},{id:1936,name:"Ring of Boreas",image:"images/items/ring_of_boreas.png",stars:5},{id:1944,name:"Spirit Locket of Boreas",image:"images/items/spirit_locket_of_boreas.png",stars:5},{id:1959,name:"Andrius",image:"images/items/andrius.png",materials:[1928,1936,1944]},{id:1960,name:"Tusk of Monoceros Caeli",image:"images/items/tusk_of_monoceros_caeli.png",stars:5},{id:1968,name:"Shard of a Foul Legacy",image:"images/items/shard_of_a_foul_legacy.png",stars:5},{id:1976,name:"Shadow of the Warrior",image:"images/items/shadow_of_the_warrior.png",stars:5},{id:1991,name:"Childe",image:"images/items/childe.png",materials:[1960,1968,1976]},{id:1992,name:"Dragon Lord's Crown",image:"images/items/dragon_lord_s_crown.png",stars:5},{id:2000,name:"Bloodjade Branch",image:"images/items/bloodjade_branch.png",stars:5},{id:2008,name:"Gilded Scale",image:"images/items/gilded_scale.png",stars:5},{id:2023,name:"Azhdaha",image:"images/items/azhdaha.png",materials:[1992,2000,2008]},{id:2024,name:"Molten Moment",image:"images/items/molten_moment.png",stars:5},{id:2032,name:"Hellfire Butterfly",image:"images/items/hellfire_butterfly.png",stars:5},{id:2040,name:"Ashen Heart",image:"images/items/ashen_heart.png",stars:5},{id:2055,name:"La Signora",image:"images/items/la_signora.png",materials:[2024,2032,2040]},{id:2056,name:"Mudra of the Malefic General",image:"images/items/mudra_of_the_malefic_general.png",stars:5},{id:2064,name:"Tears of the Calamitous God",image:"images/items/tears_of_the_calamitous_god.png",stars:5},{id:2072,name:"The Meaning of Aeons",image:"images/items/the_meaning_of_aeons.png",stars:5},{id:2087,name:"Mikoto",image:"images/items/mikoto.png",materials:[2056,2064,2072]},{id:2088,name:"Tile of Decarabian's Tower",image:"images/items/tile_of_decarabian_s_tower.png",stars:2},{id:2096,name:"Debris of Decarabian's City",image:"images/items/debris_of_decarabian_s_city.png",stars:3},{id:2104,name:"Fragment of Decarabian's Epic",image:"images/items/fragment_of_decarabian_s_epic.png",stars:4},{id:2112,name:"Scattered Piece of Decarabian's Dream",image:"images/items/scattered_piece_of_decarabian_s_dream.png",stars:5},{id:2125,days:"Monday/Thursday/Sunday",region:"Mondstadt",temple:"Cecilia Garden",group:"Cecilia Garden",tiers:{low:2088,medium:2096,high:2104,highest:2112}},{id:2128,name:"Boreal Wolf's Milk Tooth",image:"images/items/boreal_wolf_s_milk_tooth.png",stars:2},{id:2136,name:"Boreal Wolf's Cracked Tooth",image:"images/items/boreal_wolf_s_cracked_tooth.png",stars:3},{id:2144,name:"Boreal Wolf's Broken Fang",image:"images/items/boreal_wolf_s_broken_fang.png",stars:4},{id:2152,name:"Boreal Wolf's Nostalgia",image:"images/items/boreal_wolf_s_nostalgia.png",stars:5},{id:2165,days:"Tuesday/Friday/Sunday",region:"Mondstadt",temple:"Cecilia Garden",group:"Cecilia Garden",tiers:{low:2128,medium:2136,high:2144,highest:2152}},{id:2168,name:"Fetters of the Dandelion Gladiator",image:"images/items/fetters_of_the_dandelion_gladiator.png",stars:2},{id:2176,name:"Chains of the Dandelion Gladiator",image:"images/items/chains_of_the_dandelion_gladiator.png",stars:3},{id:2184,name:"Shackles of the Dandelion Gladiator",image:"images/items/shackles_of_the_dandelion_gladiator.png",stars:4},{id:2192,name:"Dream of the Dandelion Gladiator",image:"images/items/dream_of_the_dandelion_gladiator.png",stars:5},{id:2205,days:"Wednesday/Saturday/Sunday",region:"Mondstadt",temple:"Cecilia Garden",group:"Cecilia Garden",tiers:{low:2168,medium:2176,high:2184,highest:2192}},{id:2208,name:"Luminous Sands from Guyun",image:"images/items/luminous_sands_from_guyun.png",stars:2},{id:2216,name:"Lustrous Stone from Guyun",image:"images/items/lustrous_stone_from_guyun.png",stars:3},{id:2224,name:"Relic from Guyun",image:"images/items/relic_from_guyun.png",stars:4},{id:2232,name:"Divine Body from Guyun",image:"images/items/divine_body_from_guyun.png",stars:5},{id:2245,days:"Monday/Thursday/Sunday",region:"Liyue",temple:"Hidden Palace of Lianshan Formula",group:"Hidden Palace of Lianshan Formula",tiers:{low:2208,medium:2216,high:2224,highest:2232}},{id:2248,name:"Mist Veiled Lead Elixir",image:"images/items/mist_veiled_lead_elixir.png",stars:2},{id:2256,name:"Mist Veiled Mercury Elixir",image:"images/items/mist_veiled_mercury_elixir.png",stars:3},{id:2264,name:"Mist Veiled Gold Elixir",image:"images/items/mist_veiled_gold_elixir.png",stars:4},{id:2272,name:"Mist Veiled Primo Elixir",image:"images/items/mist_veiled_primo_elixir.png",stars:5},{id:2285,days:"Tuesday/Friday/Sunday",region:"Liyue",temple:"Hidden Palace of Lianshan Formula",group:"Hidden Palace of Lianshan Formula",tiers:{low:2248,medium:2256,high:2264,highest:2272}},{id:2288,name:"Grain of Aerosiderite",image:"images/items/grain_of_aerosiderite.png",stars:2},{id:2296,name:"Piece of Aerosiderite",image:"images/items/piece_of_aerosiderite.png",stars:3},{id:2304,name:"Bit of Aerosiderite",image:"images/items/bit_of_aerosiderite.png",stars:4},{id:2312,name:"Chunk of Aerosiderite",image:"images/items/chunk_of_aerosiderite.png",stars:5},{id:2325,days:"Wednesday/Saturday/Sunday",region:"Liyue",temple:"Hidden Palace of Lianshan Formula",group:"Hidden Palace of Lianshan Formula",tiers:{low:2288,medium:2296,high:2304,highest:2312}},{id:2328,name:"Coral Branch of a Distant Sea",image:"images/items/coral_branch_of_a_distant_sea.png",stars:2},{id:2336,name:"Jeweled Branch of a Distant Sea",image:"images/items/jeweled_branch_of_a_distant_sea.png",stars:3},{id:2344,name:"Jade Branch of a Distant Sea",image:"images/items/jade_branch_of_a_distant_sea.png",stars:4},{id:2352,name:"Golden Branch of a Distant Sea",image:"images/items/golden_branch_of_a_distant_sea.png",stars:5},{id:2365,days:"Monday/Thursday/Sunday",region:"Inazuma",temple:"Court of Flowing Sand",group:"Court of Flowing Sand",tiers:{low:2328,medium:2336,high:2344,highest:2352}},{id:2368,name:"Narukami's Wisdom",image:"images/items/narukami_s_wisdom.png",stars:2},{id:2376,name:"Narukami's Joy",image:"images/items/narukami_s_joy.png",stars:3},{id:2384,name:"Narukami's Affection",image:"images/items/narukami_s_affection.png",stars:4},{id:2392,name:"Narukami's Valor",image:"images/items/narukami_s_valor.png",stars:5},{id:2405,days:"Tuesday/Friday/Sunday",region:"Inazuma",temple:"Court of Flowing Sand",group:"Court of Flowing Sand",tiers:{low:2368,medium:2376,high:2384,highest:2392}},{id:2408,name:"Mask of the Wicked Lieutenant",image:"images/items/mask_of_the_wicked_lieutenant.png",stars:2},{id:2416,name:"Mask of the Tiger's Bite",image:"images/items/mask_of_the_tiger_s_bite.png",stars:3},{id:2424,name:"Mask of the One-Horned",image:"images/items/mask_of_the_one_horned.png",stars:4},{id:2432,name:"Mask of the Kijin",image:"images/items/mask_of_the_kijin.png",stars:5},{id:2445,days:"Wednesday/Saturday/Sunday",region:"Inazuma",temple:"Court of Flowing Sand",group:"Court of Flowing Sand",tiers:{low:2408,medium:2416,high:2424,highest:2432}},{id:2448,name:"Copper Talisman of the Forest Dew",image:"images/items/copper_talisman_of_the_forest_dew.png",stars:2},{id:2456,name:"Iron Talisman of the Forest Dew",image:"images/items/iron_talisman_of_the_forest_dew.png",stars:3},{id:2464,name:"Silver Talisman of the Forest Dew",image:"images/items/silver_talisman_of_the_forest_dew.png",stars:4},{id:2472,name:"Golden Talisman of the Forest Dew",image:"images/items/golden_talisman_of_the_forest_dew.png",stars:5},{id:2485,days:"Monday/Thursday/Sunday",region:"Sumeru",temple:"Tower of Abject Pride",group:"Tower of Abject Pride",tiers:{low:2448,medium:2456,high:2464,highest:2472}},{id:2488,name:"Oasis Garden's Reminiscence",image:"images/items/oasis_garden_s_reminiscence.png",stars:2},{id:2496,name:"Oasis Garden's Kindness",image:"images/items/oasis_garden_s_kindness.png",stars:3},{id:2504,name:"Oasis Garden's Mourning",image:"images/items/oasis_garden_s_mourning.png",stars:4},{id:2512,name:"Oasis Garden's Truth",image:"images/items/oasis_garden_s_truth.png",stars:5},{id:2525,days:"Tuesday/Friday/Sunday",region:"Sumeru",temple:"Tower of Abject Pride",group:"Tower of Abject Pride",tiers:{low:2488,medium:2496,high:2504,highest:2512}},{id:2528,name:"Echo of Scorching Might",image:"images/items/echo_of_scorching_might.png",stars:2},{id:2536,name:"Remnant Glow of Scorching Might",image:"images/items/remnant_glow_of_scorching_might.png",stars:3},{id:2544,name:"Dream of Scorching Might",image:"images/items/dream_of_scorching_might.png",stars:4},{id:2552,name:"Olden Days of Scorching Might",image:"images/items/olden_days_of_scorching_might.png",stars:5},{id:2565,days:"Wednesday/Saturday/Sunday",region:"Sumeru",temple:"Tower of Abject Pride",group:"Tower of Abject Pride",tiers:{low:2528,medium:2536,high:2544,highest:2552}},{id:2568,name:"Quelled Creeper",image:"images/items/quelled_creeper.png",stars:4},{id:2576,name:"Puppet Strings",image:"images/items/puppet_strings.png",stars:5},{id:2584,name:"Mirror of Mushin",image:"images/items/mirror_of_mushin.png",stars:5},{id:2592,name:"Daka's Bell",image:"images/items/daka_s_bell.png",stars:5},{id:2607,name:"Shouki",image:"images/items/shouki.png",materials:[1896,1904,1912]},{id:2610,name:"Henna Berry",image:"images/items/henna_berry.png",stars:0,region:"Sumeru"},{id:2616,name:"Light Guiding Tetrahedron",image:"images/items/light_guiding_tetrahedron.png",stars:4},{id:2626,name:"Scarab",image:"images/items/scarab.png",stars:0,region:"Sumeru"},{id:2632,name:"Perpetual Caliber",image:"images/items/perpetual_caliber.png",stars:4}];var elements=[{description:"Geo",image:"images/elements/geo.svg"},{description:"Cryo",image:"images/elements/cryo.svg"},{description:"Pyro",image:"images/elements/pyro.svg"},{description:"Hydro",image:"images/elements/hydro.svg"},{description:"Electro",image:"images/elements/electro.svg"},{description:"Dendro",image:"images/elements/dendro.svg"},{description:"Anemo",image:"images/elements/anemo.svg"}];var weapon={list:[{name:"Wolf's Gravestone",image:"images/weapons/wolf_s_gravestone.png",passive:{name:"Wolfish Tracker",description:"Increases ATK by 20~40%. On hit, attacks against opponents with less than 30% HP increase all party members' ATK by 40~80% for 12s. Can only occur once every 30s."},stars:5,subStatus:{attribute:"ATK",scaling:20},scaling:2,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:859}},{name:"Mistsplitter Reforged",image:"images/weapons/mistsplitter_reforged.png",passive:{name:"Mistsplitter's Edge",description:"Gain a 12~24% Elemental DMG Bonus for all elements and receive the might of the Mistsplitter's Emblem. At stack levels 1/2/3, Mistsplitter's Emblem provides a 8/16/28~16/32/56% Elemental DMG Bonus for the character's Elemental Type. The character will obtain 1 stack of Mistsplitter's Emblem in each of the following scenarios: Normal Attack deals Elemental DMG (stack lasts 5s), casting Elemental Burst (stack lasts 10s); Energy is less than 100% (stack disappears when Energy is full). Each stack's duration is calculated independently."},stars:5,subStatus:{attribute:"CRIT DMG",scaling:17},scaling:1,ascension:{weaponMaterial:2365,eliteMaterial:1339,commonMaterial:1019}},{name:"Skyward Spine",image:"images/weapons/skyward_spine.png",passive:{name:"Black Wing",description:"Increases CRIT Rate by 8~16% and increases Normal ATK SPD by 12%. Additionally, Normal and Charged Attacks hits on opponents have a 50% chance to trigger a vacuum blade that deals 40~100% of ATK as DMG in a small AoE. This effect can occur no more than once every 2s."},stars:5,subStatus:{attribute:"Energy Recharge",scaling:13},scaling:1,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:859}},{name:"Skyward Pride",image:"images/weapons/skyward_pride.png",passive:{name:"Sky-ripping Dragon Spine",description:"Increases all DMG by 8~16%. After using an Elemental Burst, Normal or Charged Attack, on hit, creates a vacuum blade that does 80~160% of ATK as DMG to opponents along its path. Lasts for 20s or 8 vacuum blades."},stars:5,subStatus:{attribute:"Energy Recharge",scaling:13},scaling:1,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:795}},{name:"Elegy for the End",image:"images/weapons/elegy_for_the_end.png",passive:{name:"The Parting Refrain",description:"A part of the \"Millennial Movement\" that wanders amidst the winds.Increases Elemental Mastery by 60~120.When the Elemental Skills or Elemental Bursts of the character wielding this weapon hit opponents, that character gains a Sigil of Remembrance. This effect can be triggered once every 0.2s and can be triggered even if said character is not on the field.When you possess 4 Sigils of Remembrance, all of them will be consumed and all nearby party members will obtain the \"Millennial Movement: Farewell Song\" effect for 12s.\"Millennial Movement: Farewell Song\" increases Elemental Mastery by 100~200 and increases ATK by 20~40%. Once this effect is triggered, you will not gain Sigils of Remembrance for 20s.Of the many effects of the \"Millennial Movement,\" buffs of the same type will not stack."},stars:5,subStatus:{attribute:"Energy Recharge",scaling:22},scaling:2,ascension:{weaponMaterial:2165,eliteMaterial:1147,commonMaterial:923}},{name:"Skyward Harp",image:"images/weapons/skyward_harp.png",passive:{name:"Echoing Ballad",description:"Increases CRIT DMG by 20~40%. Hits have a 60~100% chance to inflict a small AoE attack, dealing 125% Physical ATK DMG. Can only occur once every 4~2s."},stars:5,subStatus:{attribute:"CRIT Rate",scaling:4},scaling:1,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:891}},{name:"Skyward Blade",image:"images/weapons/skyward_blade.png",passive:{name:"Sky-Piercing Fang",description:"CRIT Rate increased by 4~8%. Gains Skypiercing Might upon using an Elemental Burst: Increases Movement SPD by 10%, increases ATK SPD by 10%, and Normal and Charged hits deal additional DMG equal to 20~40% of ATK. Skypiercing Might lasts for 12s."},stars:5,subStatus:{attribute:"Energy Recharge",scaling:22},scaling:2,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:795}},{name:"Engulfing Lightning",image:"images/weapons/engulfing_lightning.png",passive:{name:"Timeless Dream: Eternal Stove",description:"ATK increased by 28~56% of Energy Recharge over the base 100%. You can gain a maximum bonus of 80~120% ATK. Gain 30~50% Energy Recharge for 12s after using an Elemental Burst."},stars:5,subStatus:{attribute:"Energy Recharge",scaling:22},scaling:2,ascension:{weaponMaterial:2445,eliteMaterial:1339,commonMaterial:1019}},{name:"Everlasting Moonglow",image:"images/weapons/everlasting_moonglow.png",passive:{name:"Byakuya Kougetsu",description:"Healing Bonus increased by 10~20%, Normal Attack DMG is increased by 1~3.0% of the Max HP of the character equipping this weapon. For 12s after using an Elemental Burst, Normal Attacks that hit opponents will restore 0.6 Energy. Energy can be restored this way once every 0.1s."},stars:5,subStatus:{attribute:"HP",scaling:20},scaling:2,ascension:{weaponMaterial:2365,eliteMaterial:1371,commonMaterial:1051}},{name:"Skyward Atlas",image:"images/weapons/skyward_atlas.png",passive:{name:"Wandering Clouds",description:"Increases Elemental DMG Bonus by 12~24%. Normal Attack hits have a 50% chance to earn the favor of the clouds. which actively seek out nearby opponents to attack for 15s, dealing 160~320% ATK DMG. Can only occur once every 30s."},stars:5,subStatus:{attribute:"ATK",scaling:10},scaling:1,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:891}},{name:"Freedom-Sworn",image:"images/weapons/freedom_sworn.png",passive:{name:"Revolutionary Chorale",description:"A part of the \"Millennial Movement\" that wanders amidst the winds.Increases DMG by 10~20%.When the character wielding this weapon triggers Elemental Reactions, they gain a Sigil of Rebellion. This effect can be triggered once every 0.5s and can be triggered even if said character is not on the field.When you possess 2 Sigils of Rebellion, all of them will be consumed and all nearby party members will obtain \"Millennial Movement: Song of Resistance\" for 12s.\"Millennial Movement: Song of Resistance\" increases Normal, Charged, and Plunging Attack DMG by 16~32% and increases ATK by 20~40%. Once this effect is triggered, you will not gain Sigils of Rebellion for 20s.Of the many effects of the \"Millennial Movement,\" buffs of the same type will not stack."},stars:5,subStatus:{attribute:"Elemental Mastery",scaling:6},scaling:2,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:859}},{name:"Staff of Homa",image:"images/weapons/staff_of_homa.png",passive:{name:"Reckless Cinnabar",description:"HP increased by 20~40%. Additionally, provides an ATK Bonus based on 0.8~1.6% of the wielder's Max HP. When the wielder's HP is less than 50%, this ATK bonus is increased by an additional 1~1.8% of Max HP."},stars:5,subStatus:{attribute:"CRIT DMG",scaling:24},scaling:2,ascension:{weaponMaterial:2325,eliteMaterial:1179,commonMaterial:795}},{name:"Redhorn Stonethresher",image:"images/weapons/redhorn_stonethresher.png",passive:{name:"Gokadaiou Otogibanashi",description:"DEF is increased by 28~56%. Normal and Charged Attack DMG is increased by 40~80% of DEF."},stars:5,subStatus:{attribute:"CRIT DMG",scaling:26},scaling:3,ascension:{weaponMaterial:2405,eliteMaterial:1403,commonMaterial:1019}},{name:"Haran Geppaku Futsu",image:"images/weapons/haran_geppaku_futsu.png",passive:{name:"Honed Flow",description:"Obtain 12~24% All Elemental DMG Bonus. When other nearby party members use Elemental Skills, the character equipping this weapon will gain 1 Wavespike stack. Max 2 stacks. This effect can be triggered once every 0.3s. When the character equipping this weapon uses an Elemental Skill, all stacks of Wavespike will be consumed to gain Rippling Upheaval: each stack of Wavespike consumed will increase Normal Attack DMG by 20~40% for 8s."},stars:5,subStatus:{attribute:"CRIT Rate",scaling:10},scaling:2,ascension:{weaponMaterial:2405,eliteMaterial:1435,commonMaterial:1019}},{name:"Hunter's Path",image:"images/weapons/hunter_s_path.png",passive:{name:"At the End of the Beast-Paths",description:"Gain 12~24% All Elemental DMG Bonus. Obtain the Tireless Hunt effect after hitting an opponent with a Charged Attack. This effect increases Charged Attack DMG by 160~320% of Elemental Mastery. This effect will be removed after 12 Charged Attacks or 10s. Only 1 instance of Tireless Hunt can be gained every 12s."},stars:5,subStatus:{attribute:"CRIT Rate",scaling:17},scaling:3,ascension:{weaponMaterial:2565,eliteMaterial:1467,commonMaterial:1115}},{name:"Kagura's Verity",image:"images/weapons/kagura_s_verity.png",passive:{name:"Kagura Dance of the Sacred Sakura",description:"Gains the Kagura Dance effect when using an Elemental Skill, causing the Elemental Skill DMG of the character wielding this weapon to increase by 12~24% for 16s. Max 3 stacks. This character will gain 12~24% All Elemental DMG Bonus when they possess 3 stacks."},stars:5,subStatus:{attribute:"CRIT DMG",scaling:24},scaling:2,ascension:{weaponMaterial:2445,eliteMaterial:1403,commonMaterial:1051}},{name:"Primordial Jade Winged-Spear",image:"images/weapons/primordial_jade_winged_spear.png",passive:{name:"Eagle Spear of Justice",description:"On hit, increases ATK by 3.2~6.0% for 6s. Max 7 stacks. This effect can only occur once every 0.3s. While in possession of the maximum possible stacks, DMG dealt is increased by 12~24%."},stars:5,subStatus:{attribute:"CRIT Rate",scaling:4},scaling:1,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:923}},{name:"Primordial Jade Cutter",image:"images/weapons/primordial_jade_cutter.png",passive:{name:"Protector's Virtue",description:"HP increased by 20~40%. Additionally, provides an ATK Bonus based on 1.2~2.4% of the wielder's Max HP."},stars:5,subStatus:{attribute:"CRIT Rate",scaling:17},scaling:3,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:955}},{name:"Polar Star",image:"images/weapons/polar_star.png",passive:{name:"Daylight's Augury",description:"Elemental Skill and Elemental Burst DMG increased by 12~24%. After a Normal Attack, Charged Attack, Elemental Skill or Elemental Burst hits an opponent, 1 stack of Ashen Nightstar will be gained for 12s. When 1/2/3/4 stacks of Ashen Nightstar are present, ATK is increased by 10/20/30/48~20/40/60/96%. The stack of Ashen Nightstar created by the Normal Attack, Charged Attack, Elemental Skill or Elemental Burst will be counted independently of the others."},stars:5,subStatus:{attribute:"CRIT Rate",scaling:10},scaling:2,ascension:{weaponMaterial:2445,eliteMaterial:1403,commonMaterial:1051}},{name:"Lost Prayer to the Sacred Winds",image:"images/weapons/lost_prayer_to_the_sacred_winds.png",passive:{name:"Boundless Blessing",description:"Increases Movement SPD by 10%. When in battle, gain an 8~16% Elemental DMG Bonus every 4s. Max 4 stacks. Lasts until the character falls or leaves combat."},stars:5,subStatus:{attribute:"CRIT Rate",scaling:10},scaling:2,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:795}},{name:"Song of Broken Pines",image:"images/weapons/song_of_broken_pines.png",passive:{name:"Rebel's Banner Hymn",description:"A part of the \"Millennial Movement\" that wanders amidst the winds.Increases ATK by 16~32%, and when Normal or Charged Attacks hit opponents, the character gains a Sigil of Whispers. This effect can be triggered once every 0.3s.When you possess four Sigils of Whispers, all of them will be consumed and all nearby party members will obtain the \"Millennial Movement: Banner-Hymn\" effect for 12s.\"Millennial Movement: Banner-Hymn\" increases Normal ATK SPD by 12~24% and increases ATK by 20~40%. Once this effect is triggered, you will not gain Sigils of Whispers for 20s.Of the many effects of the \"Millennial Movement\", buffs of the same type will not stack."},stars:5,subStatus:{attribute:"Physical DMG Bonus",scaling:3},scaling:0,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:827}},{name:"Memory of Dust",image:"images/weapons/memory_of_dust.png",passive:{name:"Golden Majesty",description:"Increases Shield Strength by 20~40%. Scoring hits on opponents increases ATK by 4~8% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%."},stars:5,subStatus:{attribute:"ATK",scaling:20},scaling:2,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:827}},{name:"Summit Shaper",image:"images/weapons/summit_shaper.png",passive:{name:"Golden Majesty",description:"Increases Shield Strength by 20~40%. Scoring hits on opponents increases ATK by 4~8% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%."},stars:5,subStatus:{attribute:"ATK",scaling:20},scaling:2,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:827}},{name:"Aqua Simulacra",image:"images/weapons/aqua_simulacra.png",passive:{name:"The Cleansing Form",description:"HP is increased by 16~32%. When there are opponents nearby, the DMG dealt by the wielder of this weapon is increased by 20~40%. This will take effect whether the character is on-field or not."},stars:5,subStatus:{attribute:"CRIT DMG",scaling:26},scaling:3,ascension:{weaponMaterial:2245,eliteMaterial:1435,commonMaterial:1051}},{name:"Thundering Pulse",image:"images/weapons/thundering_pulse.png",passive:{name:"Rule By Thunder",description:"Increases ATK by 20~40% and grants the might of the Thunder Emblem. At stack levels 1/2/3, the Thunder Emblem increases Normal Attack DMG by 12/24/40~24/48/80%. The character will obtain 1 stack of Thunder Emblem in each of the following scenarios: Normal Attack deals DMG (stack lasts 5s), casting Elemental Skill (stack lasts 10s); Energy is less than 100% (stack disappears when Energy is full). Each stack's duration is calculated independently."},stars:5,subStatus:{attribute:"CRIT DMG",scaling:24},scaling:2,ascension:{weaponMaterial:2405,eliteMaterial:1371,commonMaterial:891}},{name:"Calamity Queller",image:"images/weapons/calamity_queller.png",passive:{name:"Extinguishing Precept",description:"Gain 12~24% All Elemental DMG Bonus. Obtain Consummation for 20s after using an Elemental Skill, causing ATK to increase by 3.2~6.4% per second. This ATK increase has a maximum of 6 stacks. When the character equipped with this weapon is not on the field, Consummation's ATK increase is doubled."},stars:5,subStatus:{attribute:"ATK",scaling:2},scaling:0,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:987}},{name:"Aquila Favonia",image:"images/weapons/aquila_favonia.png",passive:{name:"Falcon's Defiance",description:"ATK is increased by 20~40%. Triggers on taking DMG: the soul of the Falcon of the West awakens, holding the banner of the resistance aloft, regenerating HP equal to 100~160% of ATK and dealing 200~320% of ATK as DMG to surrounding opponents. This effect can only occur once every 15s."},stars:5,subStatus:{attribute:"Physical DMG Bonus",scaling:15},scaling:1,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:891}},{name:"The Unforged",image:"images/weapons/the_unforged.png",passive:{name:"Golden Majesty",description:"Increases Shield Strength by 20~40%. Scoring hits on opponents increases ATK by 4~8% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%."},stars:5,subStatus:{attribute:"ATK",scaling:20},scaling:2,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:955}},{name:"Amos' Bow",image:"images/weapons/amos__bow.png",passive:{name:"Strong-Willed",description:"Increases Normal Attack and Charged Attack DMG by 12~24%. After a Normal or Charged Attack is fired, DMG dealt increases by a further 8~16% every 0.1 seconds the arrow is in the air for up to 5 times."},stars:5,subStatus:{attribute:"ATK",scaling:20},scaling:2,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:795}},{name:"Vortex Vanquisher",image:"images/weapons/vortex_vanquisher.png",passive:{name:"Golden Majesty",description:"Increases Shield Strength by 20~40%. Scoring hits on opponents increases ATK by 4~8% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%."},stars:5,subStatus:{attribute:"ATK",scaling:20},scaling:2,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:955}},{name:"Prototype Starglitter",image:"images/weapons/prototype_starglitter.png",passive:{name:"Magic Affinity",description:"After using an Elemental Skill, increases Normal and Charged Attack DMG by 8~16% for 12s. Max 2 stacks."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:18},scaling:2,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:827}},{name:"Wavebreaker's Fin",image:"images/weapons/wavebreaker_s_fin.png",passive:{name:"Watatsumi Wavewalker",description:"For every point of the entire party's combined maximum Energy capacity, the Elemental Burst DMG of the character equipping this weapon is increased by 0.12~0.24%. A maximum of 40~80% increased Elemental Burst DMG can be achieved this way."},stars:4,subStatus:{attribute:"ATK",scaling:0},scaling:0,ascension:{weaponMaterial:2445,eliteMaterial:1403,commonMaterial:1019}},{name:"Prototype Rancour",image:"images/weapons/prototype_rancour.png",passive:{name:"Smashed Stone",description:"On hit, Normal or Charged Attacks increase ATK and DEF by 4~8% for 6s. Max 4 stacks. This effect can only occur once every 0.3s."},stars:4,subStatus:{attribute:"Physical DMG Bonus",scaling:11},scaling:1,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:923}},{name:"Prototype Crescent",image:"images/weapons/prototype_crescent.png",passive:{name:"Unreturning",description:"Charged Attack hits on weak points increase Movement SPD by 10% and ATK by 36~72% for 10s."},stars:4,subStatus:{attribute:"ATK",scaling:15},scaling:2,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:955}},{name:"Prototype Archaic",image:"images/weapons/prototype_archaic.png",passive:{name:"Crush",description:"On hit, Normal or Charged Attacks have a 50% chance to deal an additional 240~480% ATK DMG to opponents within a small AoE. Can only occur once every 15s."},stars:4,subStatus:{attribute:"ATK",scaling:6},scaling:1,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:827}},{name:"Prototype Amber",image:"images/weapons/prototype_amber.png",passive:{name:"Gilding",description:"Using an Elemental Burst regenerates 4~6 Energy every 2s for 6s. All party members will regenerate 4~6% HP every 2s for this duration."},stars:4,subStatus:{attribute:"HP",scaling:15},scaling:2,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:891}},{name:"Whiteblind",image:"images/weapons/whiteblind.png",passive:{name:"Infusion Blade",description:"On hit, Normal or Charged Attacks increase ATK and DEF by 6~12% for 6s. Max 4 stacks (24~48%  total). Can only occur once every 0.5s."},stars:4,subStatus:{attribute:"DEF",scaling:21},scaling:2,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:955}},{name:"Prized Isshin Blade (Shattered)",image:"images/weapons/prized_isshin_blade__shattered_.png",passive:{name:"Wandering Striker",description:"When a Normal, Charged, or Plunging Attack hits an opponent, it will release an Accused Spirit, dealing AoE DMG equal to 180% of ATK. This effect can be triggered once every 8s. The DMG done by this weapon's wielder is decreased by 50%."},stars:4,scaling:2},{name:"Prized Isshin Blade (Awakened)",image:"images/weapons/prized_isshin_blade__awakened_.png",passive:{name:"Wandering Striker",description:"When a Normal, Charged, or Plunging Attack hits an opponent, it will release an Accused Spirit, dealing AoE DMG equal to 180% of ATK and restoring 100% of ATK as HP. This effect can be triggered once every 8s. The DMG done by this weapon's wielder is decreased by 50%."},stars:4,scaling:2},{name:"Predator",image:"images/weapons/predator.png",passive:{name:"Strong Strike",description:"This weapon's effect is only applied on the following platform(s):\n\"PlayStation Network\"\nDealing Cryo DMG to opponents increases this character's Normal and Charged Attack DMG by 10% for 6s. This effect can have a maximum of 2 stacks.Additionally, when Aloy equips Predator, ATK is increased by 66."},stars:4,subStatus:{attribute:"ATK",scaling:15},scaling:2,ascension:{weaponMaterial:2405,eliteMaterial:1371,commonMaterial:891}},{name:"Windblume Ode",image:"images/weapons/windblume_ode.png",passive:{name:"Windblume Wish",description:"After using an Elemental Skill, receive a boon from the ancient wish of the Windblume, increasing ATK by 16~32% for 6s."},stars:4,subStatus:{attribute:"Elemental Mastery",scaling:4},scaling:2,ascension:{weaponMaterial:2205,eliteMaterial:1179,commonMaterial:987}},{name:"Oathsworn Eye",image:"images/weapons/oathsworn_eye.png",passive:{name:"People of the Faltering Light",description:"Increases Energy Recharge by 24~48% for 10s after using an Elemental Skill."},stars:4,subStatus:{attribute:"ATK",scaling:6},scaling:1,ascension:{weaponMaterial:2365,eliteMaterial:1403,commonMaterial:1051}},{name:"Wine and Song",image:"images/weapons/wine_and_song.png",passive:{name:"Ever-Changing",description:"Hitting an opponent with a Normal Attack decreases the Stamina consumption of Sprint or Alternate Sprint by 14~22% for 5s. Additionally, using a Sprint or Alternate Sprint ability increases ATK by 20~40% for 5s."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:8},scaling:1,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:955}},{name:"Mouun's Moon",image:"images/weapons/mouun_s_moon.png",passive:{name:"Watatsumi Wavewalker",description:"For every point of the entire party's combined maximum Energy capacity, the Elemental Burst DMG of the character equipping this weapon is increased by 0.12~0.24%. A maximum of 40~80% increased Elemental Burst DMG can be achieved this way."},stars:4,subStatus:{attribute:"ATK",scaling:6},scaling:1,ascension:{weaponMaterial:2405,eliteMaterial:1371,commonMaterial:1051}},{name:"Moonpiercer",image:"images/weapons/moonpiercer.png",passive:{name:"Stillwood Moonshadow",description:"After triggering Burning, Quicken, Aggravate, Spread, Bloom, Hyperbloom, or Burgeon, a Leaf of Revival will be created around the character for a maximum of 10s. When picked up, the Leaf will grant the character 16~32% ATK for 12s. Only 1 Leaf can be generated this way every 20s. This effect can still be triggered if the character is not on the field."},stars:4,subStatus:{attribute:"Elemental Mastery",scaling:2},scaling:1,ascension:{weaponMaterial:2525,eliteMaterial:1499,commonMaterial:923}},{name:"Akuoumaru",image:"images/weapons/akuoumaru.png",passive:{name:"Watatsumi Wavewalker",description:"For every point of the entire party's combined maximum Energy capacity, the Elemental Burst DMG of the character equipping this weapon is increased by 0.12~0.24%. A maximum of 40~80% increased Elemental Burst DMG can be achieved this way."},stars:4,subStatus:{attribute:"ATK",scaling:15},scaling:2,ascension:{weaponMaterial:2365,eliteMaterial:1403,commonMaterial:1019}},{name:"Rainslasher",image:"images/weapons/rainslasher.png",passive:{name:"Bane of Storm and Tide",description:"Increases DMG against opponents affected by Hydro or Electro by 20~36%."},stars:4,subStatus:{attribute:"Elemental Mastery",scaling:4},scaling:2,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:859}},{name:"Royal Greatsword",image:"images/weapons/royal_greatsword.png",passive:{name:"Focus",description:"Upon dealing damage to an opponent, increases CRIT Rate by 8~16%. Max 5 stacks. A CRIT hit removes all existing stacks."},stars:4,subStatus:{attribute:"ATK",scaling:6},scaling:1,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:795}},{name:"Royal Bow",image:"images/weapons/royal_bow.png",passive:{name:"Focus",description:"Upon dealing damage to an opponent, increases CRIT Rate by 8~16%. Max 5 stacks. A CRIT hit removes all existing stacks."},stars:4,subStatus:{attribute:"ATK",scaling:15},scaling:2,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:859}},{name:"The Widsith",image:"images/weapons/the_widsith.png",passive:{name:"Debut",description:"When a character takes the field, they will gain a random theme song for 10s. This can only occur once every 30s.Recitative: ATK is increased by 60~120%.Aria: Increases all Elemental DMG by 48~96%.Interlude: Elemental Mastery is increased by 240~480."},stars:4,subStatus:{attribute:"CRIT DMG",scaling:22},scaling:2,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:827}},{name:"Solar Pearl",image:"images/weapons/solar_pearl.png",passive:{name:"Solar Shine",description:"Normal Attack hits increase Elemental Skill and Elemental Burst DMG by 20~40% for 6s. Likewise, Elemental Skill or Elemental Burst hits increase Normal Attack DMG by 20~40% for 6s."},stars:4,subStatus:{attribute:"CRIT Rate",scaling:6},scaling:2,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:987}},{name:"Snow-Tombed Starsilver",image:"images/weapons/snow_tombed_starsilver.png",passive:{name:"Frost Burial",description:"Hitting an opponent with Normal and Charged Attacks has a 60~100% chance of forming and dropping an Everfrost Icicle above them, dealing AoE DMG equal to 80~140% of ATK. Opponents affected by Cryo are instead dealt DMG equal to 200~360% of ATK. Can only occur once every 10s."},stars:4,subStatus:{attribute:"Physical DMG Bonus",scaling:11},scaling:1,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:795}},{name:"The Alley Flash",image:"images/weapons/the_alley_flash.png",passive:{name:"Itinerant Hero",description:"Increases DMG dealt by the character equipping this weapon by 12~24%. Taking DMG disables this effect for 5s."},stars:4,subStatus:{attribute:"Elemental Mastery",scaling:0},scaling:0,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:859}},{name:"The Bell",image:"images/weapons/the_bell.png",passive:{name:"Rebellious Guardian",description:"Taking DMG generates a shield which absorbs DMG up to 20~32% of max HP. This shield lasts for 10s or until broken, and can only be triggered once every 45s. While protected by a shield, the character gains 12~24% increased DMG."},stars:4,subStatus:{attribute:"HP",scaling:15},scaling:2,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:987}},{name:"The Black Sword",image:"images/weapons/the_black_sword.png",passive:{name:"Justice",description:"Increases DMG dealt by Normal and Charged Attacks by 20~40%.Additionally, regenerates 60~100% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s."},stars:4,subStatus:{attribute:"CRIT Rate",scaling:6},scaling:2,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:795}},{name:"The Flute",image:"images/weapons/the_flute.png",passive:{name:"Chord",description:"Normal or Charged Attacks grant a Harmonic on hits. Gaining 5 Harmonics triggers the power of music and deals 100~200% ATK DMG to surrounding enemies. Harmonics last up to 30s, and a maximum of 1 can be gained every 0.5s."},stars:4,subStatus:{attribute:"ATK",scaling:15},scaling:2,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:795}},{name:"The Stringless",image:"images/weapons/the_stringless.png",passive:{name:"Arrowless Song",description:"Increases Elemental Skill and Elemental Burst DMG by 24~48%."},stars:4,subStatus:{attribute:"Elemental Mastery",scaling:4},scaling:2,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:891}},{name:"The Viridescent Hunt",image:"images/weapons/the_viridescent_hunt.png",passive:{name:"Verdant Wind",description:"Upon hit, Normal and Aimed Shot Attacks have a 50% chance to generate a Cyclone, which will continuously attract surrounding opponents, dealing 40~80% of ATK as DMG to these opponents every 0.5s for 4s. This effect can only occur once every 14~10s."},stars:4,subStatus:{attribute:"CRIT Rate",scaling:6},scaling:2,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:891}},{name:"Sapwood Blade",image:"images/weapons/sapwood_blade.png",passive:{name:"Forest Sanctuary",description:"After triggering Burning, Quicken, Aggravate, Spread, Bloom, Hyperbloom, or Burgeon, a Leaf of Consciousness will be created around the character for a maximum of 10s. When picked up, the Leaf will grant the character 60~120 Elemental Mastery for 12s. Only 1 Leaf can be generated this way every 20s. This effect can still be triggered if the character is not on the field. The Leaf of Consciousness' effect cannot stack."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:8},scaling:1,ascension:{weaponMaterial:2485,eliteMaterial:1499,commonMaterial:1115}},{name:"Sword of Descension",image:"images/weapons/sword_of_descension.png",passive:{name:"Descension",description:"This weapon's effect is only applied on the following platform(s):\n\"PlayStation Network\"\nHitting enemies with Normal or Charged Attacks grants a 50% chance to deal 200% ATK as DMG in a small AoE. This effect can only occur once every 10s.Additionally, if the Traveler equips the Sword of Descension, their ATK is increased by 66."},stars:4,subStatus:{attribute:"ATK",scaling:12},scaling:4,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:955}},{name:"Sacrificial Sword",image:"images/weapons/sacrificial_sword.png",passive:{name:"Composed",description:"After dealing damage to an opponent with an Elemental Skill, the skill has a 40~80% chance to end its own CD. Can only occur once every 30~16s."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:23},scaling:3,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:859}},{name:"Sacrificial Greatsword",image:"images/weapons/sacrificial_greatsword.png",passive:{name:"Composed",description:"After dealing damage to an opponent with an Elemental Skill, the skill has a 40~80% chance to end its own CD. Can only occur once every 30~16s."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:8},scaling:1,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:891}},{name:"Sacrificial Fragments",image:"images/weapons/sacrificial_fragments.png",passive:{name:"Composed",description:"After dealing damage to an opponent with an Elemental Skill, the skill has a 40~80% chance to end its own CD. Can only occur once every 30~16s."},stars:4,subStatus:{attribute:"Elemental Mastery",scaling:7},scaling:3,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:955}},{name:"Sacrificial Bow",image:"images/weapons/sacrificial_bow.png",passive:{name:"Composed",description:"After dealing damage to an opponent with an Elemental Skill, the skill has a 40~80% chance to end its own CD. Can only occur once every 30~16s."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:8},scaling:1,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:795}},{name:"Rust",image:"images/weapons/rust.png",passive:{name:"Rapid Firing",description:"Increases Normal Attack DMG by 40~80% but decreases Charged Attack DMG by 10%."},stars:4,subStatus:{attribute:"ATK",scaling:15},scaling:2,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:827}},{name:"Royal Spear",image:"images/weapons/royal_spear.png",passive:{name:"Focus",description:"Upon dealing damage to an opponent, increases CRIT Rate by 8~16%. Max 5 stacks. A CRIT hit removes all existing stacks."},stars:4,subStatus:{attribute:"ATK",scaling:6},scaling:1,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:923}},{name:"Royal Longsword",image:"images/weapons/royal_longsword.png",passive:{name:"Focus",description:"Upon dealing damage to an opponent, increases CRIT Rate by 8~16%. Max 5 stacks. A CRIT hit removes all existing stacks."},stars:4,subStatus:{attribute:"ATK",scaling:15},scaling:2,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:891}},{name:"Royal Grimoire",image:"images/weapons/royal_grimoire.png",passive:{name:"Focus",description:"Upon dealing damage to an opponent, increases CRIT Rate by 8~16%. Max 5 stacks. A CRIT hit removes all existing stacks."},stars:4,subStatus:{attribute:"ATK",scaling:6},scaling:1,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:923}},{name:"Serpent Spine",image:"images/weapons/serpent_spine.png",passive:{name:"Wavesplitter",description:"Every 4s a character is on the field, they will deal 6~10% more DMG and take 3~2%  more DMG. This effect has a maximum of 5 stacks and will not be reset if the character leaves the field, but will be reduced by 1 stack when the character takes DMG."},stars:4,subStatus:{attribute:"CRIT Rate",scaling:6},scaling:2,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:987}},{name:"\"The Catch\"",image:"images/weapons/_the_catch_.png",passive:{name:"Shanty",description:"Increases Elemental Burst DMG by 16~32% and Elemental Burst CRIT Rate by 6~12%."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:18},scaling:2,ascension:{weaponMaterial:2445,eliteMaterial:1339,commonMaterial:1051}},{name:"Mitternachts Waltz",image:"images/weapons/mitternachts_waltz.png",passive:{name:"Evernight Duet",description:"Normal Attack hits on opponents increase Elemental Skill DMG by 20~40% for 5s. Elemental Skill hits on opponents increase Normal Attack DMG by 20~40% for 5s."},stars:4,subStatus:{attribute:"Physical DMG Bonus",scaling:21},scaling:2,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:955}},{name:"Favonius Codex",image:"images/weapons/favonius_codex.png",passive:{name:"Windfall",description:"CRIT hits have a 60~100% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12~6s."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:18},scaling:2,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:859}},{name:"Forest Regalia",image:"images/weapons/forest_regalia.png",passive:{name:"Forest Sanctuary",description:"After triggering Burning, Quicken, Aggravate, Spread, Bloom, Hyperbloom, or Burgeon, a Leaf of Consciousness will be created around the character for a maximum of 10s. When picked up, the Leaf will grant the character 60~120 Elemental Mastery for 12s. Only 1 Leaf can be generated this way every 20s. This effect can still be triggered if the character is not on the field. The Leaf of Consciousness' effect cannot stack."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:8},scaling:1,ascension:{weaponMaterial:2485,eliteMaterial:1499,commonMaterial:1115}},{name:"Blackcliff Pole",image:"images/weapons/blackcliff_pole.png",passive:{name:"Press the Advantage",description:"After defeating an opponent, ATK is increased by 12~24% for 30s. This effect has a maximum of 3 stacks, and the duration of each stack is independent of the others."},stars:4,subStatus:{attribute:"CRIT DMG",scaling:22},scaling:2,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:923}},{name:"Festering Desire",image:"images/weapons/festering_desire.png",passive:{name:"Undying Admiration",description:"Increases Elemental Skill DMG by 16~32% and Elemental Skill CRIT Rate by 6~12%."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:18},scaling:2,ascension:{weaponMaterial:2205,eliteMaterial:1147,commonMaterial:923}},{name:"Blackcliff Slasher",image:"images/weapons/blackcliff_slasher.png",passive:{name:"Press the Advantage",description:"After defeating an opponent, ATK is increased by 12~24% for 30s. This effect has a maximum of 3 stacks, and the duration of each stack is independent of the others."},stars:4,subStatus:{attribute:"CRIT DMG",scaling:22},scaling:2,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:923}},{name:"Favonius Warbow",image:"images/weapons/favonius_warbow.png",passive:{name:"Windfall",description:"CRIT hits have a 60~100% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12~6s."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:23},scaling:3,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:987}},{name:"Favonius Sword",image:"images/weapons/favonius_sword.png",passive:{name:"Windfall",description:"CRIT hits have a 60~100% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12~6s."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:23},scaling:3,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:891}},{name:"Favonius Lance",image:"images/weapons/favonius_lance.png",passive:{name:"Windfall",description:"CRIT Hits have a 60~100% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12~6s."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:8},scaling:1,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:795}},{name:"Favonius Greatsword",image:"images/weapons/favonius_greatsword.png",passive:{name:"Windfall",description:"CRIT hits have a 60~100% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12~6s."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:23},scaling:3,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:923}},{name:"Blackcliff Warbow",image:"images/weapons/blackcliff_warbow.png",passive:{name:"Press the Advantage",description:"After defeating an opponent, ATK is increased by 12~24% for 30s. This effect has a maximum of 3 stacks, and the duration of each stack is independent of the others."},stars:4,subStatus:{attribute:"CRIT DMG",scaling:13},scaling:1,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:987}},{name:"Fruit of Fulfillment",image:"images/weapons/fruit_of_fulfillment.png",passive:{name:"Full Circle",description:"Obtain the \"Wax and Wane\" effect after an Elemental Reaction is triggered, gaining 24~36 Elemental Mastery while losing 5% ATK. For every 0.3s, 1 stack of Wax and Wane can be gained. Max 5 stacks. For every 6s that go by without an Elemental Reaction being triggered, 1 stack will be lost. This effect can be triggered even when the character is off-field."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:18},scaling:2,ascension:{weaponMaterial:2525,eliteMaterial:1435,commonMaterial:1083}},{name:"Fading Twilight",image:"images/weapons/fading_twilight.png",passive:{name:"Radiance of the Deeps",description:"Has three states, Evengleam, Afterglow, and Dawnblaze, which increase DMG dealt by 6%/10%/14%~12%/20%/28% respectively. When attacks hit opponents, this weapon will switch to the next state. This weapon can change states once every 7s. The character equipping this weapon can still trigger the state switch while not on the field."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:8},scaling:1,ascension:{weaponMaterial:2325,eliteMaterial:1275,commonMaterial:859}},{name:"Mappa Mare",image:"images/weapons/mappa_mare.png",passive:{name:"Infusion Scroll",description:"Triggering an Elemental reaction grants a 8~16% Elemental DMG Bonus for 10s. Max 2 stacks."},stars:4,subStatus:{attribute:"Elemental Mastery",scaling:2},scaling:1,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:795}},{name:"Cinnabar Spindle",image:"images/weapons/cinnabar_spindle.png",passive:{name:"Spotless Heart",description:"Elemental Skill DMG is increased by 40~80% of DEF. The effect will be triggered no more than once every 1.5s and will be cleared 0.1s after the Elemental Skill deals DMG."},stars:4,subStatus:{attribute:"DEF",scaling:25},scaling:3,ascension:{weaponMaterial:2125,eliteMaterial:1211,commonMaterial:827}},{name:"Compound Bow",image:"images/weapons/compound_bow.png",passive:{name:"Infusion Arrow",description:"Normal Attack and Charged Attack hits increase ATK by 4~8% and Normal ATK SPD by 1.2~2.4% for 6s. Max 4 stacks. Can only occur once every 0.3s."},stars:4,subStatus:{attribute:"Physical DMG Bonus",scaling:25},scaling:3,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:923}},{name:"Eye of Perception",image:"images/weapons/eye_of_perception.png",passive:{name:"Echo",description:"Normal and Charged Attacks have a 50% chance to fire a Bolt of Perception, dealing 240~360% ATK as DMG. This bolt can bounce between opponents a maximum of 4 times. This effect can occur once every 12~8s."},stars:4,subStatus:{attribute:"ATK",scaling:22},scaling:3,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:827}},{name:"End of the Line",image:"images/weapons/end_of_the_line.png",passive:{name:"Net Snapper",description:"Triggers the Flowrider effect after using an Elemental Skill, dealing 80~160% ATK as AoE DMG upon hitting an opponent with an attack. Flowrider will be removed after 15s or after causing 3 instances of AoE DMG. Only 1 instance of AoE DMG can be caused every 2s in this way. Flowrider can be triggered once every 12s."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:18},scaling:2,ascension:{weaponMaterial:2565,eliteMaterial:1467,commonMaterial:1083}},{name:"Crescent Pike",image:"images/weapons/crescent_pike.png",passive:{name:"Infusion Needle",description:"After picking up an Elemental Orb/Particle, Normal and Charged Attacks deal an additional 20~40% ATK as DMG for 5s."},stars:4,subStatus:{attribute:"Physical DMG Bonus",scaling:11},scaling:1,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:955}},{name:"Dragonspine Spear",image:"images/weapons/dragonspine_spear.png",passive:{name:"Frost Burial",description:"Hitting an opponent with Normal and Charged Attacks has a 60~100% chance of forming and dropping an Everfrost Icicle above them, dealing 80~140% AoE ATK DMG. Opponents affected by Cryo are dealt 200~360% ATK DMG instead by the icicle. Can only occur once every 10s."},stars:4,subStatus:{attribute:"Physical DMG Bonus",scaling:25},scaling:3,ascension:{weaponMaterial:2165,eliteMaterial:1243,commonMaterial:923}},{name:"Dragon's Bane",image:"images/weapons/dragon_s_bane.png",passive:{name:"Bane of Flame and Water",description:"Increases DMG against opponents affected by Hydro or Pyro by 20~36%."},stars:4,subStatus:{attribute:"Elemental Mastery",scaling:7},scaling:3,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:859}},{name:"Deathmatch",image:"images/weapons/deathmatch.png",passive:{name:"Gladiator",description:"If there are at least 2 opponents nearby, ATK is increased by 16~32% and DEF is increased by 16~32%. If there are fewer than 2 opponents nearby, ATK is increased by 24~48%."},stars:4,subStatus:{attribute:"CRIT Rate",scaling:13},scaling:3,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:987}},{name:"Frostbearer",image:"images/weapons/frostbearer.png",passive:{name:"Frost Burial",description:"Hitting an opponent with Normal and Charged Attacks has a 60~100% chance of forming and dropping an Everfrost Icicle above them, dealing 80~140% AoE ATK DMG. Opponents affected by Cryo are dealt 200~360% ATK DMG instead by the icicle. Can only occur once every 10s."},stars:4,subStatus:{attribute:"ATK",scaling:15},scaling:2,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:987}},{name:"Hakushin Ring",image:"images/weapons/hakushin_ring.png",passive:{name:"Sakura Saiguu",description:"After the character equipped with this weapon triggers an Electro elemental reaction, nearby party members of an Elemental Type involved in the elemental reaction receive a 10~20% Elemental DMG Bonus for their element, lasting 6s. Elemental Bonuses gained in this way cannot be stacked."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:8},scaling:1,ascension:{weaponMaterial:2365,eliteMaterial:1371,commonMaterial:859}},{name:"King's Squire",image:"images/weapons/king_s_squire.png",passive:{name:"Labyrinth Lord's Instruction",description:"Obtain the Teachings of the Forest effect when unleashing Elemental Skills and Bursts, increasing Elemental Mastery by 60~140 for 12s. This effect will be removed when switching characters. When the Teachings of the Forest effect ends or is removed, it will deal 100~180% of ATK as DMG to 1 nearby opponent. The Teachings of the Forest effect can be triggered once every 20s."},stars:4,subStatus:{attribute:"ATK",scaling:22},scaling:3,ascension:{weaponMaterial:2565,eliteMaterial:1467,commonMaterial:891}},{name:"Alley Hunter",image:"images/weapons/alley_hunter.png",passive:{name:"Oppidan Ambush",description:"While the character equipped with this weapon is in the party but not on the field, their DMG increases by 2~4% every second up to a max of 20~40%. When the character is on the field for more than 4s, the aforementioned DMG buff decreases by 4~8% per second until it reaches 0%."},stars:4,subStatus:{attribute:"ATK",scaling:6},scaling:1,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:795}},{name:"Luxurious Sea-Lord",image:"images/weapons/luxurious_sea_lord.png",passive:{name:"Oceanic Victory",description:"Increases Elemental Burst DMG by 12~24%. When Elemental Burst hits opponents, there is a 100% chance of summoning a huge onrush of tuna that deals 100~200% ATK as AoE DMG. This effect can occur once every 15s."},stars:4,subStatus:{attribute:"ATK",scaling:22},scaling:3,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:795}},{name:"Lithic Spear",image:"images/weapons/lithic_spear.png",passive:{name:"Lithic Axiom - Unity",description:"For every character in the party who hails from Liyue, the character who equips this weapon gains 7~11% ATK increase and a 3~7% CRIT Rate increase. This effect stacks up to 4 times."},stars:4,subStatus:{attribute:"ATK",scaling:6},scaling:1,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:891}},{name:"Amenoma Kageuchi",image:"images/weapons/amenoma_kageuchi.png",passive:{name:"Iwakura Succession",description:"After casting an Elemental Skill, gain 1 Succession Seed. This effect can be triggered once every 5s. The Succession Seed lasts for 30s. Up to 3 Succession Seeds may exist simultaneously. After using an Elemental Burst, all Succession Seeds are consumed and after 2s, the character regenerates 6~12 Energy for each seed consumed."},stars:4,subStatus:{attribute:"ATK",scaling:22},scaling:3,ascension:{weaponMaterial:2365,eliteMaterial:1339,commonMaterial:1019}},{name:"Lithic Blade",image:"images/weapons/lithic_blade.png",passive:{name:"Lithic Axiom - Unity",description:"For every character in the party who hails from Liyue, the character who equips this weapon gains 7~11% ATK increase and 3~7% CRIT Rate increase. This effect stacks up to 4 times."},stars:4,subStatus:{attribute:"ATK",scaling:15},scaling:2,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:891}},{name:"Lion's Roar",image:"images/weapons/lion_s_roar.png",passive:{name:"Bane of Fire and Thunder",description:"Increases DMG against enemies affected by Pyro or Electro by 20~36%."},stars:4,subStatus:{attribute:"ATK",scaling:15},scaling:2,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:955}},{name:"Blackcliff Longsword",image:"images/weapons/blackcliff_longsword.png",passive:{name:"Press the Advantage",description:"After defeating an opponent, ATK is increased by 12~24% for 30s. This effect has a maximum of 3 stacks, and the duration of each stack is independent of the others."},stars:4,subStatus:{attribute:"CRIT DMG",scaling:13},scaling:1,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:891}},{name:"Kitain Cross Spear",image:"images/weapons/kitain_cross_spear.png",passive:{name:"Samurai Conduct",description:"Increases Elemental Skill DMG by 6~12%. After Elemental Skill hits an opponent, the character loses 3 Energy but regenerates 3~5 Energy every 2s for the next 6s. This effect can occur once every 10s. Can be triggered even when the character is not on the field."},stars:4,subStatus:{attribute:"Elemental Mastery",scaling:2},scaling:1,ascension:{weaponMaterial:2445,eliteMaterial:1339,commonMaterial:955}},{name:"Katsuragikiri Nagamasa",image:"images/weapons/katsuragikiri_nagamasa.png",passive:{name:"Samurai Conduct",description:"Increases Elemental Skill DMG by 6~12%. After Elemental Skill hits an opponent, the character loses 3 Energy but regenerates 3~5 Energy every 2s for the next 6s. This effect can occur once every 10s. Can be triggered even when the character is not on the field."},stars:4,subStatus:{attribute:"Energy Recharge",scaling:18},scaling:2,ascension:{weaponMaterial:2405,eliteMaterial:1339,commonMaterial:1019}},{name:"Kagotsurube Isshin",image:"images/weapons/kagotsurube_isshin.png",passive:{name:"Isshin Art Clarity",description:"When a Normal, Charged, or Plunging Attack hits an opponent, it will whip up a Hewing Gale, dealing AoE DMG equal to 180% of ATK and increasing ATK by 15% for 8s. This effect can be triggered once every 8s."},stars:4,subStatus:{attribute:"ATK",scaling:15},scaling:2,ascension:{weaponMaterial:2445,eliteMaterial:1435,commonMaterial:1051}},{name:"Iron Sting",image:"images/weapons/iron_sting.png",passive:{name:"Infusion Stinger",description:"Dealing Elemental DMG increases all DMG by 6~12% for 6s. Max 2 stacks. Can only occur once every 1s."},stars:4,subStatus:{attribute:"Elemental Mastery",scaling:4},scaling:2,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:987}},{name:"Hamayumi",image:"images/weapons/hamayumi.png",passive:{name:"Full Draw",description:"Increases Normal Attack DMG by 16~32% and Charged Attack DMG by 12~24%. When the equipping character's Energy reaches 100%, this effect is increased by 100%."},stars:4,subStatus:{attribute:"ATK",scaling:22},scaling:3,ascension:{weaponMaterial:2405,eliteMaterial:1371,commonMaterial:891}},{name:"Blackcliff Agate",image:"images/weapons/blackcliff_agate.png",passive:{name:"Press the Advantage",description:"After defeating an opponent, ATK is increased by 12~24% for 30s. This effect has a maximum of 3 stacks, and the duration of each stack is independent of the others."},stars:4,subStatus:{attribute:"CRIT DMG",scaling:22},scaling:2,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:859}},{name:"Dodoco Tales",image:"images/weapons/dodoco_tales.png",passive:{name:"Dodoventure!",description:"Normal Attack hits on opponents increase Charged Attack DMG by 16~32% for 6s. Charged Attack hits on opponents increase ATK by 8~16% for 6s."},stars:4,subStatus:{attribute:"ATK",scaling:22},scaling:3,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:827}},{name:"Black Tassel",image:"images/weapons/black_tassel.png",passive:{name:"Bane of the Soft",description:"Increases DMG against slimes by 40~80%."},stars:3,subStatus:{attribute:"HP",scaling:19},scaling:2,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:891}},{name:"Bloodtainted Greatsword",image:"images/weapons/bloodtainted_greatsword.png",passive:{name:"Bane of Fire and Thunder",description:"Increases DMG against opponents affected by Pyro or Electro by 12~24%."},stars:3,subStatus:{attribute:"Elemental Mastery",scaling:5},scaling:2,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:891}},{name:"Twin Nephrite",image:"images/weapons/twin_nephrite.png",passive:{name:"Guerilla Tactic",description:"Defeating an opponent increases Movement SPD and ATK by 12~20% for 15s."},stars:3,subStatus:{attribute:"CRIT Rate",scaling:1},scaling:0,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:923}},{name:"White Iron Greatsword",image:"images/weapons/white_iron_greatsword.png",passive:{name:"Cull the Weak",description:"Defeating an opponent restores 8~16% HP."},stars:3,subStatus:{attribute:"DEF",scaling:16},scaling:1,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:795}},{name:"White Tassel",image:"images/weapons/white_tassel.png",passive:{name:"Sharp",description:"Increases Normal Attack DMG by 24~48%."},stars:3,subStatus:{attribute:"CRIT Rate",scaling:5},scaling:1,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:923}},{name:"Traveler's Handy Sword",image:"images/weapons/traveler_s_handy_sword.png",passive:{name:"Journey",description:"Each Elemental Orb or Particle collected restores 1~2% HP."},stars:3,subStatus:{attribute:"DEF",scaling:7},scaling:0,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:859}},{name:"Cool Steel",image:"images/weapons/cool_steel.png",passive:{name:"Bane of Water and Ice",description:"Increases DMG against opponents affected by Hydro or Cryo by 12~24%."},stars:3,subStatus:{attribute:"ATK",scaling:12},scaling:1,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:891}},{name:"Dark Iron Sword",image:"images/weapons/dark_iron_sword.png",passive:{name:"Overloaded",description:"Upon causing an Overloaded, Superconduct, Electro-Charged, Quicken, Aggravate, Hyperbloom, or Electro-infused Swirl reaction, ATK is increased by 20~40% for 12s."},stars:3,subStatus:{attribute:"Elemental Mastery",scaling:3},scaling:1,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:827}},{name:"Thrilling Tales of Dragon Slayers",image:"images/weapons/thrilling_tales_of_dragon_slayers.png",passive:{name:"Heritage",description:"When switching characters, the new character taking the field has their ATK increased by 24~48% for 10s. This effect can only occur once every 20s."},stars:3,subStatus:{attribute:"HP",scaling:12},scaling:1,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:859}},{name:"Messenger",image:"images/weapons/messenger.png",passive:{name:"Archer's Message",description:"Charged Attack hits on weak spots deal an additional 100~200% ATK DMG as CRIT DMG. Can only occur once every 10s."},stars:3,subStatus:{attribute:"CRIT DMG",scaling:9},scaling:0,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:955}},{name:"Debate Club",image:"images/weapons/debate_club.png",passive:{name:"Blunt Conclusion",description:"After using an Elemental Skill, Normal or Charged Attacks, on hit, deal an additional 60~120% ATK DMG in a small area. Effect lasts 15s. DMG can only occur once every 3s."},stars:3,subStatus:{attribute:"ATK",scaling:12},scaling:1,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:827}},{name:"Fillet Blade",image:"images/weapons/fillet_blade.png",passive:{name:"Gash",description:"On hit, has 50% chance to deal 240~400% ATK DMG to a single enemy. Can only occur once every 15~11s."},stars:3,subStatus:{attribute:"ATK",scaling:12},scaling:1,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:955}},{name:"Magic Guide",image:"images/weapons/magic_guide.png",passive:{name:"Bane of Storm and Tide",description:"Increases DMG against opponents affected by Hydro or Electro by 12~24%."},stars:3,subStatus:{attribute:"Elemental Mastery",scaling:5},scaling:2,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:795}},{name:"Otherworldly Story",image:"images/weapons/otherworldly_story.png",passive:{name:"Energy Shower",description:"Each Elemental Orb or Particle collected restores 1~2% HP."},stars:3,subStatus:{attribute:"Energy Recharge",scaling:14},scaling:1,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:827}},{name:"Harbinger of Dawn",image:"images/weapons/harbinger_of_dawn.png",passive:{name:"Vigorous",description:"When HP is above 90%, increases CRIT Rate by 14~28%."},stars:3,subStatus:{attribute:"CRIT DMG",scaling:19},scaling:1,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:795}},{name:"Slingshot",image:"images/weapons/slingshot.png",passive:{name:"Slingshot",description:"If a Normal or Charged Attack hits a target within 0.3s of being fired, increases DMG by 36~60%. Otherwise, decreases DMG by 10%."},stars:3,subStatus:{attribute:"CRIT Rate",scaling:9},scaling:2,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:827}},{name:"Raven Bow",image:"images/weapons/raven_bow.png",passive:{name:"Bane of Flame and Water",description:"Increases DMG against opponents affected by Hydro or Pyro by 12~24%."},stars:3,subStatus:{attribute:"Elemental Mastery",scaling:1},scaling:0,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:891}},{name:"Recurve Bow",image:"images/weapons/recurve_bow.png",passive:{name:"Cull the Weak",description:"Defeating an opponent restores 8~16% HP."},stars:3,subStatus:{attribute:"HP",scaling:19},scaling:2,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:859}},{name:"Halberd",image:"images/weapons/halberd.png",passive:{name:"Heavy",description:"Normal Attacks deal an additional 160~320% DMG. Can only occur once every 10s."},stars:3,subStatus:{attribute:"ATK",scaling:5},scaling:0,ascension:{weaponMaterial:2285,eliteMaterial:1243,commonMaterial:987}},{name:"Ferrous Shadow",image:"images/weapons/ferrous_shadow.png",passive:{name:"Unbending",description:"When HP falls below 70~90%, increases Charged Attack DMG by 30~50%, and Charged Attacks become much harder to interrupt."},stars:3,subStatus:{attribute:"HP",scaling:12},scaling:1,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:987}},{name:"Skyrider Greatsword",image:"images/weapons/skyrider_greatsword.png",passive:{name:"Courage",description:"On hit, Normal or Charged Attacks increase ATK by 6~10% for 6s. Max 4 stacks. Can only occur once every 0.5s."},stars:3,subStatus:{attribute:"Physical DMG Bonus",scaling:16},scaling:1,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:955}},{name:"Skyrider Sword",image:"images/weapons/skyrider_sword.png",passive:{name:"Determination",description:"Using an Elemental Burst grants a 12~24% increase in ATK and Movement SPD for 15s."},stars:3,subStatus:{attribute:"Energy Recharge",scaling:21},scaling:2,ascension:{weaponMaterial:2325,eliteMaterial:1307,commonMaterial:923}},{name:"Emerald Orb",image:"images/weapons/emerald_orb.png",passive:{name:"Rapids",description:"Upon causing a Vaporize, Electro-Charged, Frozen, or a Hydro-infused Swirl reaction, increases ATK by 20~40% for 12s."},stars:3,subStatus:{attribute:"Elemental Mastery",scaling:1},scaling:0,ascension:{weaponMaterial:2245,eliteMaterial:1275,commonMaterial:955}},{name:"Sharpshooter's Oath",image:"images/weapons/sharpshooter_s_oath.png",passive:{name:"Precise",description:"Increases DMG against weak spots by 24~48%."},stars:3,subStatus:{attribute:"CRIT DMG",scaling:19},scaling:1,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:795}},{name:"Seasoned Hunter's Bow",image:"images/weapons/seasoned_hunter_s_bow.png",stars:2,scaling:0,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:955}},{name:"Silver Sword",image:"images/weapons/silver_sword.png",stars:2,scaling:0,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:891}},{name:"Iron Point",image:"images/weapons/iron_point.png",stars:2,scaling:0,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:859}},{name:"Pocket Grimoire",image:"images/weapons/pocket_grimoire.png",stars:2,scaling:0,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:827}},{name:"Old Merc's Pal",image:"images/weapons/old_merc_s_pal.png",stars:2,scaling:0,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:795}},{name:"Hunter's Bow",image:"images/weapons/hunter_s_bow.png",stars:1,scaling:0,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:955}},{name:"Waster Greatsword",image:"images/weapons/waster_greatsword.png",stars:1,scaling:0,ascension:{weaponMaterial:2165,eliteMaterial:1179,commonMaterial:795}},{name:"Beginner's Protector",image:"images/weapons/beginner_s_protector.png",stars:1,scaling:0,ascension:{weaponMaterial:2205,eliteMaterial:1211,commonMaterial:859}},{name:"Apprentice's Notes",image:"images/weapons/apprentice_s_notes.png",stars:1,scaling:0,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:827}},{name:"Dull Blade",image:"images/weapons/dull_blade.png",stars:1,scaling:0,ascension:{weaponMaterial:2125,eliteMaterial:1147,commonMaterial:891}}],ascension:[[{mora:0,weaponMaterial:{quantity:1,tier:"low"},eliteMaterial:{quantity:1,tier:"low"},monsterMaterial:{quantity:1,tier:"low"}},{mora:5000,weaponMaterial:{quantity:1,tier:"medium"},eliteMaterial:{quantity:4,tier:"low"},monsterMaterial:{quantity:4,tier:"low"}},{mora:5000,weaponMaterial:{quantity:2,tier:"medium"},eliteMaterial:{quantity:2,tier:"medium"},monsterMaterial:{quantity:2,tier:"medium"}},{mora:10000,weaponMaterial:{quantity:1,tier:"high"},eliteMaterial:{quantity:4,tier:"medium"},monsterMaterial:{quantity:4,tier:"medium"}}],[{mora:5000,weaponMaterial:{quantity:1,tier:"low"},eliteMaterial:{quantity:1,tier:"low"},monsterMaterial:{quantity:1,tier:"low"}},{mora:5000,weaponMaterial:{quantity:1,tier:"medium"},eliteMaterial:{quantity:5,tier:"low"},monsterMaterial:{quantity:5,tier:"low"}},{mora:10000,weaponMaterial:{quantity:3,tier:"medium"},eliteMaterial:{quantity:3,tier:"medium"},monsterMaterial:{quantity:3,tier:"medium"}},{mora:15000,weaponMaterial:{quantity:1,tier:"high"},eliteMaterial:{quantity:5,tier:"medium"},monsterMaterial:{quantity:5,tier:"medium"}}],[{mora:5000,weaponMaterial:{quantity:2,tier:"low"},eliteMaterial:{quantity:2,tier:"low"},monsterMaterial:{quantity:2,tier:"low"}},{mora:10000,weaponMaterial:{quantity:2,tier:"medium"},eliteMaterial:{quantity:8,tier:"low"},monsterMaterial:{quantity:8,tier:"low"}},{mora:15000,weaponMaterial:{quantity:4,tier:"medium"},eliteMaterial:{quantity:4,tier:"medium"},monsterMaterial:{quantity:4,tier:"medium"}},{mora:20000,weaponMaterial:{quantity:2,tier:"high"},eliteMaterial:{quantity:8,tier:"medium"},monsterMaterial:{quantity:8,tier:"medium"}},{mora:25000,weaponMaterial:{quantity:4,tier:"high"},eliteMaterial:{quantity:6,tier:"high"},monsterMaterial:{quantity:6,tier:"high"}},{mora:30000,weaponMaterial:{quantity:3,tier:"highest"},eliteMaterial:{quantity:12,tier:"high"},monsterMaterial:{quantity:12,tier:"high"}}],[{mora:5000,weaponMaterial:{quantity:3,tier:"low"},eliteMaterial:{quantity:3,tier:"low"},monsterMaterial:{quantity:3,tier:"low"}},{mora:15000,weaponMaterial:{quantity:3,tier:"medium"},eliteMaterial:{quantity:12,tier:"low"},monsterMaterial:{quantity:12,tier:"low"}},{mora:20000,weaponMaterial:{quantity:6,tier:"medium"},eliteMaterial:{quantity:6,tier:"medium"},monsterMaterial:{quantity:6,tier:"medium"}},{mora:30000,weaponMaterial:{quantity:3,tier:"high"},eliteMaterial:{quantity:12,tier:"medium"},monsterMaterial:{quantity:12,tier:"medium"}},{mora:35000,weaponMaterial:{quantity:6,tier:"high"},eliteMaterial:{quantity:9,tier:"high"},monsterMaterial:{quantity:9,tier:"high"}},{mora:45000,weaponMaterial:{quantity:4,tier:"highest"},eliteMaterial:{quantity:18,tier:"high"},monsterMaterial:{quantity:18,tier:"high"}}],[{mora:10000,weaponMaterial:{quantity:5,tier:"low"},eliteMaterial:{quantity:5,tier:"low"},monsterMaterial:{quantity:5,tier:"low"}},{mora:20000,weaponMaterial:{quantity:5,tier:"medium"},eliteMaterial:{quantity:18,tier:"low"},monsterMaterial:{quantity:18,tier:"low"}},{mora:30000,weaponMaterial:{quantity:9,tier:"medium"},eliteMaterial:{quantity:9,tier:"medium"},monsterMaterial:{quantity:9,tier:"medium"}},{mora:45000,weaponMaterial:{quantity:5,tier:"high"},eliteMaterial:{quantity:18,tier:"medium"},monsterMaterial:{quantity:18,tier:"medium"}},{mora:55000,weaponMaterial:{quantity:9,tier:"high"},eliteMaterial:{quantity:14,tier:"high"},monsterMaterial:{quantity:14,tier:"high"}},{mora:65000,weaponMaterial:{quantity:6,tier:"highest"},eliteMaterial:{quantity:27,tier:"high"},monsterMaterial:{quantity:27,tier:"high"}}]],types:[{description:"Sword",image:"images/weapons/sword.png"},{description:"Bow",image:"images/weapons/bow.png"},{description:"Claymore",image:"images/weapons/claymore.png"},{description:"Catalyst",image:"images/weapons/catalyst.png"},{description:"Polearm",image:"images/weapons/polearm.png"}],levelCap:[70,70,90,90,90],statuses:{attackBefore:[[23,56,102,130,158,185],[33,80,139,174,209,243],[40,102,187,239,292,344,396,448],[39,94,169,216,263,309,355,401],[38,86,151,193,234,274,314,354],[45,128,247,321,395,470,545,620],[44,119,226,293,361,429,497,565],[42,109,205,266,327,388,449,510],[41,99,184,238,293,347,401,454],[39,94,176,229,282,335,388,440],[49,145,286,374,464,555,648,741],[48,133,261,341,423,506,590,674],[46,122,235,308,382,457,532,608],[44,110,210,275,341,408,475,542]],attackAfter:[[68,113,141,169],[91,151,186,220],[121,207,259,311,363,415],[113,189,236,282,329,375],[105,171,212,253,294,334],[154,273,347,421,496,571],[144,252,319,387,455,523],[135,231,292,353,414,475],[125,210,264,319,373,427],[120,202,255,308,361,414],[176,317,406,495,586,679],[164,292,373,455,537,621],[153,266,340,414,488,563],[141,241,307,373,439,506]],starOffset:[0,1,2,5,10],sub:[[3,5.3,7.7,8.9,10.1,11.3,12.5,13.8],[3.4,6,8.8,10.1,11.5,12.9,14.2,15.6],[3.6,6.4,7.8,10.7,12.2,13.6,15.1,16.5],[4.5,8,11.6,13.4,15.2,17,18.9,20.7],[4.8,8.5,12.4,14.3,16.2,18.2,20.1,22.1],[5.1,9,13.1,15.2,17.3,19.3,21.4,23.4],[6,10.6,15.5,17.9,20.3,22.7,25.1,27.6],[6.4,11.3,16.4,19,21.6,24.1,26.7,27.5],[6.7,11.8,17.2,19.9,22.6,25.2,27.9,30.6],[6.8,12,17.5,20.3,23,25.7,28.5,31.2],[7.2,12.7,18.5,21.4,24.4,27.3,30.2,33.1],[7.5,13.3,19.3,22.4,25.4,28.4,31.5,34.5],[7.7,13.5,19.7,22.8,25.9,29,32.1,35.2],[8,14.1,20.6,23.8,27.1,30.3,33.5,36.8],[8.5,15,21.9,25.3,28.8,32.2,35.6,39],[9,15.9,23.2,26.8,30.4,34.1,37.7,41.3],[9.6,16.9,24.6,28.5,32.3,36.2,40.1,43.9],[9.6,17,24.7,28.6,32.5,36.4,40.2,44.1],[10,17.7,25.8,29.8,33.8,37.9,41.9,45.9],[10.2,18,26.3,30.4,34.6,38.6,42.7,46.9],[10.8,19.1,27.8,32.2,36.5,40.9,45.3,49.6],[11.3,20,29,33.5,38.1,42.6,47.2,51.7],[12,21.2,30.9,35.7,40.6,45.4,50.3,55.1],[13.3,23.6,34.3,39.7,45.1,50.5,55.9,61.3],[14.4,25.4,37.1,42.9,48.7,54.5,60.3,66.2],[15,26.5,38.7,44.7,50.8,56.8,62.9,69],[19.2,33.9,49.4,57.2,65,72.7,80.4,88.2],[12,21,31,36,41,45,50,55],[20,36,53,61,69,77,85,94],[24,42,62,71,81,91,101,110],[31,54,79,91,104,116,128,141],[36,64,93,107,122,136,151,165],[41,72,105,122,138,154,171,187],[43,76,111,129,146,164,181,198],[48,85,124,143,162,182,201,221]],subAbsOffset:27},exp:[[125,200,275,350,475,575,700,850,1000,1150,1300,1475,1650,1850,2050,2250,2450,2675,2925,3150,3575,3825,4100,4400,4700,5000,5300,5600,5925,6275,6600,6950,7325,7675,8050,8425,8825,9225,9625,10025,10975,11425,11875,12350,12825,13300,13775,14275,14800,15300,16625,17175,17725,18300,18875,19475,20075,20675,21300,21925,23675,24350,25025,25700,26400,27125,27825,28550,29275],[175,275,400,550,700,875,1050,1250,1475,1700,1950,2225,2475,2775,3050,3375,3700,4025,4375,4725,5350,5750,6175,6600,7025,7475,7950,8425,8900,9400,9900,10450,10975,11525,12075,12650,13225,13825,14425,15050,16450,17125,17825,18525,19225,19950,20675,21425,22175,22950,24925,25750,26600,27450,28325,29225,30100,31025,31950,32875,35500,36500,37525,38575,39600,40675,41750,42825,43900],[275,425,600,800,1025,1275,1550,1850,2175,2500,2875,3250,3650,4050,4500,4950,5400,5900,6425,6925,7850,8425,9050,9675,10325,10975,11650,12350,13050,13800,14525,15300,16100,16900,17700,18550,19400,20275,21175,22050,24150,25125,26125,27150,28200,29250,30325,31425,32550,33650,36550,37775,39000,40275,41550,42850,44150,45500,46850,48225,52075,53550,55050,56550,58100,59650,61225,62800,64400,66025,71075,72825,74575,76350,78150,80000,81850,83700,85575,87500,103275,116075,130425,146500,164550,184775,207400,232775,261200],[400,625,900,1200,1550,1950,2350,2800,3300,3800,4350,4925,5525,6150,6800,7500,8200,8950,9725,10500,11900,12775,13700,14650,15625,16625,17650,18700,19775,20900,22025,23200,24375,25600,26825,28100,29400,30725,32075,33425,36575,38075,39600,41150,42725,44325,45950,47600,49300,51000,55375,57225,59100,61025,62950,64925,66900,68925,70975,73050,78900,81125,83400,85700,88025,90375,92750,95150,97575,100050,107675,110325,113000,115700,118425,121200,124000,126825,129675,132575,156475,175875,197600,221975,249300,279950,314250,352700,395775],[600,950,1350,1800,2325,2925,3525,4200,4950,5700,6525,7400,8300,9225,10200,11250,12300,13425,14600,15750,17850,19175,20550,21975,23450,24950,26475,28050,29675,31350,33050,34800,36575,38400,40250,42150,44100,46100,48125,50150,54875,57125,59400,61725,64100,66500,68925,71400,73950,76500,83075,85850,88650,91550,94425,97400,100350,103400,106475,109575,118350,121700,125100,128550,132050,135575,139125,142725,146375,150075,161525,165500,169500,173550,177650,181800,186000,190250,194525,198875,234725,263825,296400,332975,373950,419925,471375,529050,593675]]};var character={list:[{name:"Albedo",image:"images/characters/albedo.png",stars:5,region:"Mondstadt",weapon:0,element:0,ascension:{gemGroup:764,localSpecialty:98,monsterGroup:859,bossMaterial:320},talentAscension:{monsterGroup:859,bookSeries:1605,bossMaterial:1960}},{name:"Aloy",image:"images/characters/aloy.png",stars:5,region:"None",weapon:1,element:1,ascension:{gemGroup:724,localSpecialty:218,monsterGroup:1051,bossMaterial:360},talentAscension:{monsterGroup:1051,bookSeries:1541,bossMaterial:2024}},{name:"Amber",image:"images/characters/amber.png",stars:4,region:"Mondstadt",weapon:1,element:2,ascension:{gemGroup:524,localSpecialty:122,monsterGroup:891,bossMaterial:336},talentAscension:{monsterGroup:891,bookSeries:1541,bossMaterial:1912}},{name:"Arataki Itto",image:"images/characters/arataki_itto.png",stars:5,region:"Inazuma",weapon:2,element:0,ascension:{gemGroup:764,localSpecialty:202,monsterGroup:795,bossMaterial:408},talentAscension:{monsterGroup:795,bookSeries:1765,bossMaterial:2040}},{name:"Barbara",image:"images/characters/barbara.png",stars:4,region:"Mondstadt",weapon:3,element:3,ascension:{gemGroup:564,localSpecialty:114,monsterGroup:859,bossMaterial:344},talentAscension:{monsterGroup:859,bookSeries:1541,bossMaterial:1936}},{name:"Beidou",image:"images/characters/beidou.png",stars:4,region:"Liyue",weapon:2,element:4,ascension:{gemGroup:644,localSpecialty:146,monsterGroup:955,bossMaterial:312},talentAscension:{monsterGroup:955,bookSeries:1701,bossMaterial:1912}},{name:"Bennett",image:"images/characters/bennett.png",stars:4,region:"Mondstadt",weapon:0,element:2,ascension:{gemGroup:524,localSpecialty:106,monsterGroup:955,bossMaterial:336},talentAscension:{monsterGroup:955,bookSeries:1573,bossMaterial:1896}},{name:"Candace",image:"images/characters/candace.png",stars:4,region:"Sumeru",weapon:4,element:3,ascension:{gemGroup:564,localSpecialty:2610,monsterGroup:1115,bossMaterial:2616},talentAscension:{monsterGroup:1115,bookSeries:1829,bossMaterial:2064}},{name:"Chongyun",image:"images/characters/chongyun.png",stars:4,region:"Liyue",weapon:2,element:1,ascension:{gemGroup:724,localSpecialty:194,monsterGroup:827,bossMaterial:328},talentAscension:{monsterGroup:827,bookSeries:1669,bossMaterial:1912}},{name:"Collei",image:"images/characters/collei.png",stars:4,region:"Sumeru",weapon:1,element:5,ascension:{gemGroup:604,localSpecialty:274,monsterGroup:891,bossMaterial:432},talentAscension:{monsterGroup:891,bookSeries:1893,bossMaterial:2064}},{name:"Cyno",image:"images/characters/cyno.png",stars:5,region:"Sumeru",weapon:4,element:4,ascension:{gemGroup:644,localSpecialty:2626,monsterGroup:859,bossMaterial:440},talentAscension:{monsterGroup:859,bookSeries:1829,bossMaterial:2056}},{name:"Diluc",image:"images/characters/diluc.png",stars:5,region:"Mondstadt",weapon:2,element:2,ascension:{gemGroup:524,localSpecialty:122,monsterGroup:923,bossMaterial:336},talentAscension:{monsterGroup:923,bookSeries:1573,bossMaterial:1896}},{name:"Diona",image:"images/characters/diona.png",stars:4,region:"Mondstadt",weapon:1,element:1,ascension:{gemGroup:724,localSpecialty:74,monsterGroup:891,bossMaterial:328},talentAscension:{monsterGroup:891,bookSeries:1541,bossMaterial:1968}},{name:"Dori",image:"images/characters/dori.png",stars:4,region:"Sumeru",weapon:2,element:4,ascension:{gemGroup:644,localSpecialty:298,monsterGroup:1115,bossMaterial:440},talentAscension:{monsterGroup:1115,bookSeries:1861,bossMaterial:2000}},{name:"Eula",image:"images/characters/eula.png",stars:5,region:"Mondstadt",weapon:2,element:1,ascension:{gemGroup:724,localSpecialty:130,monsterGroup:827,bossMaterial:360},talentAscension:{monsterGroup:827,bookSeries:1573,bossMaterial:1992}},{name:"Faruzan",image:"images/characters/faruzan.png",stars:4,region:"Sumeru",weapon:1,element:6,ascension:{gemGroup:684,localSpecialty:2610,monsterGroup:1115,bossMaterial:2616},talentAscension:{monsterGroup:1115,bookSeries:1829,bossMaterial:2576}},{name:"Fischl",image:"images/characters/fischl.png",stars:4,region:"Mondstadt",weapon:1,element:4,ascension:{gemGroup:644,localSpecialty:122,monsterGroup:891,bossMaterial:312},talentAscension:{monsterGroup:891,bookSeries:1605,bossMaterial:1944}},{name:"Ganyu",image:"images/characters/ganyu.png",stars:5,region:"Liyue",weapon:1,element:1,ascension:{gemGroup:724,localSpecialty:170,monsterGroup:987,bossMaterial:328},talentAscension:{monsterGroup:987,bookSeries:1669,bossMaterial:1976}},{name:"Gorou",image:"images/characters/gorou.png",stars:4,region:"Inazuma",weapon:1,element:0,ascension:{gemGroup:764,localSpecialty:250,monsterGroup:1051,bossMaterial:376},talentAscension:{monsterGroup:1051,bookSeries:1797,bossMaterial:2024}},{name:"Hu Tao",image:"images/characters/hu_tao.png",stars:5,region:"Liyue",weapon:4,element:2,ascension:{gemGroup:524,localSpecialty:154,monsterGroup:987,bossMaterial:352},talentAscension:{monsterGroup:987,bookSeries:1669,bossMaterial:1968}},{name:"Jean",image:"images/characters/jean.png",stars:5,region:"Mondstadt",weapon:0,element:6,ascension:{gemGroup:684,localSpecialty:130,monsterGroup:827,bossMaterial:304},talentAscension:{monsterGroup:827,bookSeries:1573,bossMaterial:1896}},{name:"Kaedehara Kazuha",image:"images/characters/kaedehara_kazuha.png",stars:5,region:"Inazuma",weapon:0,element:6,ascension:{gemGroup:684,localSpecialty:242,monsterGroup:955,bossMaterial:368},talentAscension:{monsterGroup:955,bookSeries:1669,bossMaterial:2008}},{name:"Kaeya",image:"images/characters/kaeya.png",stars:4,region:"Mondstadt",weapon:0,element:1,ascension:{gemGroup:724,localSpecialty:74,monsterGroup:955,bossMaterial:328},talentAscension:{monsterGroup:955,bookSeries:1605,bossMaterial:1944}},{name:"Kamisato Ayaka",image:"images/characters/kamisato_ayaka.png",stars:5,region:"Inazuma",weapon:0,element:1,ascension:{gemGroup:724,localSpecialty:210,monsterGroup:1019,bossMaterial:376},talentAscension:{monsterGroup:1019,bookSeries:1765,bossMaterial:2000}},{name:"Kamisato Ayato",image:"images/characters/kamisato_ayato.png",stars:5,region:"Inazuma",weapon:0,element:3,ascension:{gemGroup:564,localSpecialty:210,monsterGroup:1019,bossMaterial:392},talentAscension:{monsterGroup:1019,bookSeries:1765,bossMaterial:2056}},{name:"Keqing",image:"images/characters/keqing.png",stars:5,region:"Liyue",weapon:0,element:4,ascension:{gemGroup:644,localSpecialty:194,monsterGroup:987,bossMaterial:312},talentAscension:{monsterGroup:987,bookSeries:1637,bossMaterial:1936}},{name:"Klee",image:"images/characters/klee.png",stars:5,region:"Mondstadt",weapon:3,element:2,ascension:{gemGroup:524,localSpecialty:114,monsterGroup:859,bossMaterial:336},talentAscension:{monsterGroup:859,bookSeries:1541,bossMaterial:1936}},{name:"Kujou Sara",image:"images/characters/kujou_sara.png",stars:4,region:"Inazuma",weapon:1,element:4,ascension:{gemGroup:644,localSpecialty:226,monsterGroup:827,bossMaterial:400},talentAscension:{monsterGroup:827,bookSeries:1765,bossMaterial:2040}},{name:"Kuki Shinobu",image:"images/characters/kuki_shinobu.png",stars:4,region:"Inazuma",weapon:0,element:4,ascension:{gemGroup:644,localSpecialty:234,monsterGroup:1051,bossMaterial:424},talentAscension:{monsterGroup:1051,bookSeries:1765,bossMaterial:2064}},{name:"Layla",image:"images/characters/layla.png",stars:4,region:"Sumeru",weapon:0,element:1,ascension:{gemGroup:724,localSpecialty:290,monsterGroup:859,bossMaterial:2632},talentAscension:{monsterGroup:859,bookSeries:1861,bossMaterial:2584}},{name:"Lisa",image:"images/characters/lisa.png",stars:4,region:"Mondstadt",weapon:3,element:4,ascension:{gemGroup:644,localSpecialty:90,monsterGroup:795,bossMaterial:312},talentAscension:{monsterGroup:795,bookSeries:1605,bossMaterial:1904}},{name:"Mona",image:"images/characters/mona.png",stars:5,region:"Mondstadt",weapon:3,element:3,ascension:{gemGroup:564,localSpecialty:114,monsterGroup:987,bossMaterial:344},talentAscension:{monsterGroup:987,bookSeries:1573,bossMaterial:1936}},{name:"Nahida",image:"images/characters/nahida.png",stars:5,region:"Sumeru",weapon:3,element:5,ascension:{gemGroup:604,localSpecialty:298,monsterGroup:1083,bossMaterial:2568},talentAscension:{monsterGroup:1083,bookSeries:1861,bossMaterial:2576}},{name:"Nilou",image:"images/characters/nilou.png",stars:5,region:"Sumeru",weapon:0,element:3,ascension:{gemGroup:564,localSpecialty:282,monsterGroup:1083,bossMaterial:2632},talentAscension:{monsterGroup:1083,bookSeries:1893,bossMaterial:2064}},{name:"Ningguang",image:"images/characters/ningguang.png",stars:4,region:"Liyue",weapon:3,element:0,ascension:{gemGroup:764,localSpecialty:162,monsterGroup:923,bossMaterial:320},talentAscension:{monsterGroup:923,bookSeries:1637,bossMaterial:1944}},{name:"Noelle",image:"images/characters/noelle.png",stars:4,region:"Mondstadt",weapon:2,element:0,ascension:{gemGroup:764,localSpecialty:90,monsterGroup:827,bossMaterial:320},talentAscension:{monsterGroup:827,bookSeries:1573,bossMaterial:1904}},{name:"Qiqi",image:"images/characters/qiqi.png",stars:5,region:"Liyue",weapon:0,element:1,ascension:{gemGroup:724,localSpecialty:186,monsterGroup:859,bossMaterial:328},talentAscension:{monsterGroup:859,bookSeries:1637,bossMaterial:1928}},{name:"Raiden Shogun",image:"images/characters/raiden_shogun.png",stars:5,region:"Inazuma",weapon:4,element:4,ascension:{gemGroup:644,localSpecialty:258,monsterGroup:1019,bossMaterial:400},talentAscension:{monsterGroup:1019,bookSeries:1797,bossMaterial:2024}},{name:"Razor",image:"images/characters/razor.png",stars:4,region:"Mondstadt",weapon:2,element:4,ascension:{gemGroup:644,localSpecialty:82,monsterGroup:827,bossMaterial:312},talentAscension:{monsterGroup:827,bookSeries:1573,bossMaterial:1904}},{name:"Rosaria",image:"images/characters/rosaria.png",stars:4,region:"Mondstadt",weapon:4,element:1,ascension:{gemGroup:724,localSpecialty:90,monsterGroup:923,bossMaterial:328},talentAscension:{monsterGroup:923,bookSeries:1605,bossMaterial:1976}},{name:"Sangonomiya Kokomi",image:"images/characters/sangonomiya_kokomi.png",stars:5,region:"Inazuma",weapon:3,element:3,ascension:{gemGroup:564,localSpecialty:250,monsterGroup:1051,bossMaterial:392},talentAscension:{monsterGroup:1051,bookSeries:1733,bossMaterial:2032}},{name:"Sayu",image:"images/characters/sayu.png",stars:4,region:"Inazuma",weapon:2,element:6,ascension:{gemGroup:684,localSpecialty:218,monsterGroup:987,bossMaterial:368},talentAscension:{monsterGroup:987,bookSeries:1797,bossMaterial:2008}},{name:"Shenhe",image:"images/characters/shenhe.png",stars:5,region:"Liyue",weapon:4,element:1,ascension:{gemGroup:724,localSpecialty:170,monsterGroup:987,bossMaterial:416},talentAscension:{monsterGroup:987,bookSeries:1637,bossMaterial:2032}},{name:"Shikanoin Heizou",image:"images/characters/shikanoin_heizou.png",stars:4,region:"Inazuma",weapon:3,element:6,ascension:{gemGroup:684,localSpecialty:202,monsterGroup:955,bossMaterial:424},talentAscension:{monsterGroup:955,bookSeries:1733,bossMaterial:2072}},{name:"Sucrose",image:"images/characters/sucrose.png",stars:4,region:"Mondstadt",weapon:3,element:6,ascension:{gemGroup:684,localSpecialty:106,monsterGroup:987,bossMaterial:304},talentAscension:{monsterGroup:987,bookSeries:1541,bossMaterial:1944}},{name:"Tartaglia",image:"images/characters/tartaglia.png",stars:5,region:"Snezhnaya",weapon:1,element:3,ascension:{gemGroup:564,localSpecialty:178,monsterGroup:923,bossMaterial:344},talentAscension:{monsterGroup:923,bookSeries:1541,bossMaterial:1968}},{name:"Thoma",image:"images/characters/thoma.png",stars:4,region:"Inazuma",weapon:4,element:2,ascension:{gemGroup:524,localSpecialty:266,monsterGroup:955,bossMaterial:384},talentAscension:{monsterGroup:955,bookSeries:1733,bossMaterial:2032}},{name:"Tighnari",image:"images/characters/tighnari.png",stars:5,region:"Sumeru",weapon:1,element:5,ascension:{gemGroup:604,localSpecialty:290,monsterGroup:1083,bossMaterial:432},talentAscension:{monsterGroup:1083,bookSeries:1829,bossMaterial:2072}},{name:"Traveler",image:"images/characters/traveler.png",stars:5,region:"None",weapon:0,ascension:{gemGroup:484,localSpecialty:106,monsterGroup:827},talentAscension:{Anemo:[{monster:832,book:1512},{monster:840,book:1552},{monster:840,book:1584},{monster:840,book:1520},{monster:840,book:1552},{monster:848,book:1592,boss:1912},{monster:848,book:1528,boss:1912},{monster:848,book:1560,boss:1912},{monster:848,book:1592,boss:1912,crown:1}],Geo:{"normal attack":[{monster:832,book:1512},{monster:840,book:1552},{monster:840,book:1584},{monster:840,book:1520},{monster:840,book:1552},{monster:848,book:1592,boss:1912},{monster:848,book:1528,boss:1912},{monster:848,book:1560,boss:1912},{monster:848,book:1592,boss:1912,crown:1}],"elemental skill or burst":[{monster:864,book:1608},{monster:872,book:1648},{monster:872,book:1680},{monster:872,book:1616},{monster:872,book:1648},{monster:880,book:1688,boss:1928},{monster:880,book:1624,boss:1928},{monster:880,book:1656,boss:1928},{monster:880,book:1688,boss:1928,crown:1}]},Electro:[{monster:992,book:1704},{monster:1000,book:1744},{monster:1000,book:1776},{monster:1000,book:1712},{monster:1000,book:1744},{monster:1008,book:1784,boss:1992},{monster:1008,book:1720,boss:1992},{monster:1008,book:1752,boss:1992},{monster:1008,book:1784,boss:1992,crown:1}],Dendro:[{monster:1056,book:1800},{monster:1064,book:1840},{monster:1064,book:1872},{monster:1064,book:1808},{monster:1064,book:1840},{monster:1072,book:1880,boss:2056},{monster:1072,book:1816,boss:2056},{monster:1072,book:1848,boss:2056},{monster:1072,book:1880,boss:2056,crown:1}],Unaligned:[{monster:832,book:1512},{monster:840,book:1552},{monster:840,book:1584},{monster:840,book:1520},{monster:840,book:1552},{monster:848,book:1592,boss:1912},{monster:848,book:1528,boss:1912},{monster:848,book:1560,boss:1912},{monster:848,book:1592,boss:1912,crown:1}]}},{name:"Venti",image:"images/characters/venti.png",stars:5,region:"Mondstadt",weapon:1,element:6,ascension:{gemGroup:684,localSpecialty:98,monsterGroup:795,bossMaterial:304},talentAscension:{monsterGroup:795,bookSeries:1605,bossMaterial:1928}},{name:"Wanderer",image:"images/characters/wanderer.png",stars:5,region:"Liyue",weapon:3,element:6,ascension:{gemGroup:684,localSpecialty:274,monsterGroup:1019,bossMaterial:2632},talentAscension:{monsterGroup:1019,bookSeries:1893,bossMaterial:2592}},{name:"Xiangling",image:"images/characters/xiangling.png",stars:4,region:"Liyue",weapon:4,element:2,ascension:{gemGroup:524,localSpecialty:138,monsterGroup:795,bossMaterial:336},talentAscension:{monsterGroup:795,bookSeries:1669,bossMaterial:1904}},{name:"Xiao",image:"images/characters/xiao.png",stars:5,region:"Liyue",weapon:4,element:6,ascension:{gemGroup:684,localSpecialty:170,monsterGroup:795,bossMaterial:352},talentAscension:{monsterGroup:795,bookSeries:1637,bossMaterial:1976}},{name:"Xingqiu",image:"images/characters/xingqiu.png",stars:4,region:"Liyue",weapon:0,element:3,ascension:{gemGroup:564,localSpecialty:154,monsterGroup:827,bossMaterial:344},talentAscension:{monsterGroup:827,bookSeries:1701,bossMaterial:1928}},{name:"Xinyan",image:"images/characters/xinyan.png",stars:4,region:"Liyue",weapon:2,element:2,ascension:{gemGroup:524,localSpecialty:186,monsterGroup:955,bossMaterial:336},talentAscension:{monsterGroup:955,bookSeries:1701,bossMaterial:1960}},{name:"Yae Miko",image:"images/characters/yae_miko.png",stars:5,region:"Inazuma",weapon:3,element:4,ascension:{gemGroup:644,localSpecialty:242,monsterGroup:1019,bossMaterial:416},talentAscension:{monsterGroup:1019,bookSeries:1797,bossMaterial:2072}},{name:"Yanfei",image:"images/characters/yanfei.png",stars:4,region:"Liyue",weapon:3,element:2,ascension:{gemGroup:524,localSpecialty:146,monsterGroup:955,bossMaterial:352},talentAscension:{monsterGroup:955,bookSeries:1701,bossMaterial:2000}},{name:"Yelan",image:"images/characters/yelan.png",stars:5,region:"Liyue",weapon:1,element:3,ascension:{gemGroup:564,localSpecialty:178,monsterGroup:923,bossMaterial:424},talentAscension:{monsterGroup:923,bookSeries:1637,bossMaterial:2008}},{name:"Yaoyao",image:"images/characters/yaoyao.png",stars:4,region:"Liyue",weapon:4,element:5,ascension:{gemGroup:604,localSpecialty:138,monsterGroup:795,bossMaterial:2568},talentAscension:{monsterGroup:795,bookSeries:1669,bossMaterial:2592}},{name:"Yoimiya",image:"images/characters/yoimiya.png",stars:5,region:"Inazuma",weapon:1,element:2,ascension:{gemGroup:524,localSpecialty:234,monsterGroup:859,bossMaterial:384},talentAscension:{monsterGroup:859,bookSeries:1733,bossMaterial:1992}},{name:"Yun Jin",image:"images/characters/yun_jin.png",stars:4,region:"Liyue",weapon:4,element:0,ascension:{gemGroup:764,localSpecialty:162,monsterGroup:827,bossMaterial:408},talentAscension:{monsterGroup:827,bookSeries:1669,bossMaterial:2040}},{name:"Zhongli",image:"images/characters/zhongli.png",stars:5,region:"Liyue",weapon:4,element:0,ascension:{gemGroup:764,localSpecialty:194,monsterGroup:795,bossMaterial:320},talentAscension:{monsterGroup:795,bookSeries:1701,bossMaterial:1960}}],ascension:[{mora:20000,gem:{quantity:1,tier:"low"},localSpecialty:3,monsterMaterial:{quantity:3,tier:"low"}},{mora:40000,gem:{quantity:3,tier:"medium"},localSpecialty:10,monsterMaterial:{quantity:15,tier:"low"},bossMaterial:2},{mora:60000,gem:{quantity:6,tier:"medium"},localSpecialty:20,monsterMaterial:{quantity:12,tier:"medium"},bossMaterial:4},{mora:80000,gem:{quantity:3,tier:"high"},localSpecialty:30,monsterMaterial:{quantity:18,tier:"medium"},bossMaterial:8},{mora:100000,gem:{quantity:6,tier:"high"},localSpecialty:45,monsterMaterial:{quantity:12,tier:"high"},bossMaterial:12},{mora:120000,gem:{quantity:6,tier:"highest"},localSpecialty:60,monsterMaterial:{quantity:24,tier:"high"},bossMaterial:20}],talent:[{mora:12500,monsterMaterial:{quantity:6,tier:"low"},book:{quantity:3,tier:"low"}},{mora:17500,monsterMaterial:{quantity:3,tier:"medium"},book:{quantity:2,tier:"medium"}},{mora:25000,monsterMaterial:{quantity:4,tier:"medium"},book:{quantity:4,tier:"medium"}},{mora:30000,monsterMaterial:{quantity:6,tier:"medium"},book:{quantity:6,tier:"medium"}},{mora:37500,monsterMaterial:{quantity:9,tier:"medium"},book:{quantity:9,tier:"medium"}},{mora:120000,monsterMaterial:{quantity:4,tier:"high"},book:{quantity:4,tier:"high"},bossMaterial:1},{mora:260000,monsterMaterial:{quantity:6,tier:"high"},book:{quantity:6,tier:"high"},bossMaterial:1},{mora:450000,monsterMaterial:{quantity:9,tier:"high"},book:{quantity:12,tier:"high"},bossMaterial:2},{mora:700000,monsterMaterial:{quantity:12,tier:"high"},book:{quantity:16,tier:"high"},bossMaterial:2,crown:1}],exp:[1000,1325,1700,2150,2625,3150,3725,4350,5000,5700,6450,7225,8050,8925,9825,10750,11725,12725,13775,14875,16800,18000,19250,20550,21875,23250,24650,26100,27575,29100,30650,32250,33875,35550,37250,38975,40750,42575,44425,46300,50625,52700,54775,56900,59075,61275,63525,65800,68125,70475,76500,79050,81650,84275,86950,89650,92400,95175,98000,100875,108950,112050,115175,118325,121525,124775,128075,131400,134775,138175,148700,152375,156075,159825,163600,167425,171300,175225,179175,183175,216225,243025,273100,306800,344600,386950,434425,487625,547200]};var genshin_data = {levelBarriers:levelBarriers,items:items,elements:elements,weapon:weapon,character:character};

    function deepClone(value) {
        if (Array.isArray(value)) {
            return value.map(v => deepClone(v));
        }
        if (typeof value === 'object') {
            const clone = {};
            for (const key in value) {
                clone[key] = deepClone(value[key]);
            }
            return clone;
        }
        return value;
    }
    function isClickInside(rect, point) {
        return point.clientX >= rect.left &&
            point.clientY >= rect.top &&
            point.clientX <= (rect.left + rect.width) &&
            point.clientY <= (rect.top + rect.height);
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    class MaterialCost {
        constructor() {
            this.materials = [];
        }
        addTiered(tiers, cost) {
            const id = tiers[cost.tier];
            if (id == null) {
                console.debug(tiers, cost.tier);
                throw new Error("No id for the requested tier");
            }
            const material = this.materials.find((m) => m.id === id);
            if (material) {
                material.quantity += cost.quantity;
            }
            else {
                this.materials.push({ id, quantity: cost.quantity });
            }
            return this;
        }
        addSimple(id, quantity) {
            const material = this.materials.find((m) => m.id === id);
            if (material) {
                material.quantity += quantity;
            }
            else {
                this.materials.push({ id, quantity });
            }
            return this;
        }
        addItem(item) {
            const material = this.materials.find((m) => m.id === item.id);
            if (material) {
                material.quantity += item.quantity;
            }
            else {
                this.materials.push(Object.assign({}, item));
            }
            return this;
        }
        merge(other) {
            for (const other_mat of other.materials) {
                const mat = this.materials.find((m) => other_mat.id === m.id);
                if (mat) {
                    mat.quantity += other_mat.quantity;
                }
                else {
                    this.materials.push(Object.assign({}, other_mat));
                }
            }
            return this;
        }
        toItemList() {
            const items = new Array(this.materials.length);
            for (let i = 0; i < this.materials.length; i++) {
                const mat = this.materials[i];
                const item = genshin_data.items.find((i) => i.id === mat.id);
                if (item == null)
                    throw new Error("Could not find item by the id " + mat.id);
                items[i] = Object.assign(Object.assign({}, item), { quantity: mat.quantity });
            }
            return items;
        }
    }
    function extractTalentProgress(text) {
        const parts = text.split("/");
        if (parts.length != 2)
            throw new Error("Invalid level/cap format");
        const start = Number.parseInt(parts[0]);
        const end = Number.parseInt(parts[1]);
        if (start < 1 || start > 10)
            throw new Error("Invalid talent start value");
        if (end < 1 || end > 10 || end < start)
            throw new Error("Invalid talent end value");
        return { start, end };
    }
    function extractLevelAndCap(text) {
        const parts = text.split("/");
        if (parts.length != 2)
            throw new Error("Invalid level/cap format");
        const level = Number.parseInt(parts[0]);
        const cap = Number.parseInt(parts[1]);
        if (Number.isNaN(level) || Number.isNaN(cap))
            throw new Error("Invalid number for level/cap");
        const cap_index = genshin_data.levelBarriers.findIndex((lb) => lb === cap);
        if (cap_index < 0)
            throw new Error(`${cap} is not a valid level cap`);
        if (level > cap ||
            level <
                (cap_index > 0 ? genshin_data.levelBarriers[cap_index - 1] : 1))
            throw new Error("Level is not in a valid cap range");
        return { level, cap };
    }
    function extractLevelAndCapIndex(text) {
        const level_cap = extractLevelAndCap(text);
        level_cap.cap = genshin_data.levelBarriers.findIndex((lb) => lb === level_cap.cap);
        return level_cap;
    }
    function findWeaponMat(material_ids) {
        const weapon_mat = genshin_data.items.find((i) => i.id === material_ids.weaponMaterial);
        const elite_mat = genshin_data.items.find((i) => i.id === material_ids.eliteMaterial);
        const common_mat = genshin_data.items.find((i) => i.id === material_ids.commonMaterial);
        if (!(weapon_mat && elite_mat && common_mat))
            throw new Error("Invalid weapon ascension material data");
        return {
            wam: weapon_mat.tiers,
            elite: elite_mat.tiers,
            common: common_mat.tiers,
        };
    }
    function findCharacterAscensionMat(material_ids) {
        const gem = genshin_data.items.find((i) => i.id === material_ids.gemGroup);
        const common = genshin_data.items.find((i) => i.id === material_ids.monsterGroup);
        if (!(gem && common))
            throw new Error("Invalid character ascension material data");
        return {
            gem: gem.tiers,
            common: common.tiers,
        };
    }
    function findCharacterTalentMat(material_ids) {
        const book = genshin_data.items.find((i) => i.id === material_ids.bookSeries);
        const common = genshin_data.items.find((i) => i.id === material_ids.monsterGroup);
        if (!(book && common))
            throw new Error("Invalid character ascension material data");
        return {
            book: book.tiers,
            common: common.tiers,
        };
    }
    function weaponCost(config) {
        const weapon = genshin_data.weapon.list.find((w) => w.name === config.name);
        if (weapon == null)
            throw new Error(`Weapon named '${config.name}' does not exist in the database`);
        try {
            const star_index = weapon.stars - 1;
            const material = findWeaponMat(weapon.ascension);
            const start = extractLevelAndCapIndex(config.start);
            const end = extractLevelAndCapIndex(config.end);
            const ascension_cost = genshin_data.weapon.ascension[star_index].slice(start.cap, end.cap);
            return {
                mora: ascension_cost
                    .map((ac) => ac.mora)
                    .reduce((sum, mora) => sum + mora, 0),
                experience: genshin_data.weapon.exp[star_index]
                    .slice(start.level - 1, end.level - 1)
                    .reduce((sum, val) => sum + val, 0),
                wam: ascension_cost
                    .map((ac) => ac.weaponMaterial)
                    .reduce((mc, asc) => mc.addTiered(material.wam, asc), new MaterialCost()),
                common: ascension_cost
                    .map((ac) => ac.monsterMaterial)
                    .reduce((mc, asc) => mc.addTiered(material.common, asc), new MaterialCost()),
                elite: ascension_cost
                    .map((ac) => ac.eliteMaterial)
                    .reduce((mc, asc) => mc.addTiered(material.elite, asc), new MaterialCost()),
            };
        }
        catch (cause) {
            throw new Error(`Weapon: ${config.name}. ${cause.message}`);
        }
    }
    function characterAscensionCost(character, config) {
        try {
            const start = extractLevelAndCapIndex(config.level_start);
            const end = extractLevelAndCapIndex(config.level_end);
            const material = findCharacterAscensionMat(character.ascension);
            const ascension_cost = genshin_data.character.ascension.slice(start.cap, end.cap);
            return {
                mora: ascension_cost
                    .map((ac) => ac.mora)
                    .reduce((sum, mora) => sum + mora, 0),
                experience: genshin_data.character.exp
                    .slice(start.level - 1, end.level - 1)
                    .reduce((sum, val) => sum + val, 0),
                gem: ascension_cost
                    .map((ac) => ac.gem)
                    .reduce((mc, asc) => mc.addTiered(material.gem, asc), new MaterialCost()),
                common: ascension_cost
                    .map((ac) => ac.monsterMaterial)
                    .reduce((mc, asc) => mc.addTiered(material.common, asc), new MaterialCost()),
                local_specialty: {
                    id: character.ascension.localSpecialty,
                    quantity: ascension_cost
                        .map((ac) => ac.localSpecialty)
                        .reduce((sum, ls) => sum + ls, 0),
                },
                boss: {
                    id: character.ascension.bossMaterial,
                    quantity: ascension_cost
                        .map((ac) => ac.bossMaterial)
                        .filter((m) => m != null)
                        .reduce((sum, ls) => sum + ls, 0),
                },
            };
        }
        catch (cause) {
            throw new Error(`Character: ${character.name}. ${cause.message}`);
        }
    }
    function characterTalentCost(character, conf) {
        const normal = extractTalentProgress(conf.basic_talent);
        const elemental = extractTalentProgress(conf.elemental_talent);
        const burst = extractTalentProgress(conf.burst_talent);
        const material = findCharacterTalentMat(character.talentAscension);
        function regular(progress) {
            const cost = genshin_data.character.talent.slice(progress.start - 1, progress.end - 1);
            return {
                mora: cost
                    .map((ac) => ac.mora)
                    .reduce((sum, mora) => sum + mora, 0),
                common: cost
                    .map((ac) => ac.monsterMaterial)
                    .reduce((mc, m) => mc.addTiered(material.common, m), new MaterialCost()),
                book: cost
                    .map((ac) => ac.book)
                    .reduce((mc, b) => mc.addTiered(material.book, b), new MaterialCost()),
                boss: cost
                    .map((ac) => ac.bossMaterial)
                    .filter((m) => m != null)
                    .reduce((sum, b) => sum + b, 0),
                crown: cost
                    .map((ac) => ac.crown)
                    .filter((m) => m != null)
                    .reduce((sum, crown) => sum + crown, 0),
            };
        }
        const normal_cost = regular(normal);
        const elemental_cost = regular(elemental);
        const burst_cost = regular(burst);
        return {
            mora: normal_cost.mora + elemental_cost.mora + burst_cost.mora,
            common: normal_cost.common
                .merge(elemental_cost.common)
                .merge(burst_cost.common),
            book: normal_cost.book
                .merge(elemental_cost.book)
                .merge(burst_cost.book),
            boss: new MaterialCost().addItem({
                id: character.talentAscension.bossMaterial,
                quantity: normal_cost.boss + elemental_cost.boss + burst_cost.boss,
            }),
            crown: normal_cost.crown + elemental_cost.crown + burst_cost.crown,
        };
    }
    function travelerTalentCost(character, conf_by_element) {
        const cost = {
            mora: 0,
            common: new MaterialCost(),
            book: new MaterialCost(),
            boss: new MaterialCost(),
            crown: 0,
        };
        function regular(progress, material_by_level) {
            var _a;
            const mats = material_by_level.slice(progress.start - 1, progress.end - 1);
            const costs = genshin_data.character.talent.slice(progress.start - 1, progress.end - 1);
            for (let i = 0; i < costs.length; i++) {
                cost.mora += costs[i].mora;
                cost.common.addSimple(mats[i].monster, costs[i].monsterMaterial.quantity);
                cost.book.addSimple(mats[i].book, costs[i].book.quantity);
                cost.crown += (_a = costs[i].crown) !== null && _a !== void 0 ? _a : 0;
                if ("boss" in mats[i]) {
                    cost.boss.addSimple(mats[i].boss, costs[i].bossMaterial);
                }
            }
        }
        for (const [element, conf] of Object.entries(conf_by_element)) {
            const normal = extractTalentProgress(conf.basic_talent);
            const elemental = extractTalentProgress(conf.elemental_talent);
            const burst = extractTalentProgress(conf.burst_talent);
            if (!(element in character.talentAscension))
                throw new Error(`No talent build information for element ${element}`);
            if (Array.isArray(character.talentAscension[element])) {
                regular(normal, character.talentAscension[element]);
                regular(elemental, character.talentAscension[element]);
                regular(burst, character.talentAscension[element]);
            }
            else {
                regular(normal, character.talentAscension[element]["normal attack"]);
                regular(elemental, character.talentAscension[element]["elemental skill or burst"]);
                regular(burst, character.talentAscension[element]["elemental skill or burst"]);
            }
        }
        return cost;
    }
    function characterCost(conf) {
        const character = genshin_data.character.list.find((w) => w.name === conf.name);
        if (character == null)
            throw new Error(`Character named '${conf.name}' does not exist in the database`);
        const ascension_cost = characterAscensionCost(character, conf);
        const talent_cost = character.name === "Traveler"
            ? travelerTalentCost(character, conf.talent)
            : characterTalentCost(character, conf.talent);
        return {
            mora: ascension_cost.mora + talent_cost.mora,
            experience: ascension_cost.experience,
            common: ascension_cost.common.merge(talent_cost.common),
            gem: ascension_cost.gem,
            book: talent_cost.book,
            local_specialty: ascension_cost.local_specialty,
            ascension_boss: ascension_cost.boss,
            talent_boss: talent_cost.boss,
            crown: talent_cost.crown,
        };
    }
    class TrackableItem {
        constructor(id) {
            this.quantity = 0;
            this.weapons_id = [];
            this.characters_id = [];
            this.item = genshin_data.items.find(i => i.id === id);
            if (this.item == null)
                throw new Error(`Material of id ${id} was not found`);
        }
        get item_id() {
            return this.item.id;
        }
        characterAdd(id, quantity) {
            this.quantity += quantity;
            if (quantity > 0 && !this.characters_id.includes(id)) {
                this.characters_id.push(id);
            }
        }
        weaponAdd(id, quantity) {
            this.quantity += quantity;
            if (quantity > 0 && !this.weapons_id.includes(id)) {
                this.weapons_id.push(id);
            }
        }
    }
    class TrackableList {
        constructor() {
            this.list = [];
        }
        characterAdd(character_id, item) {
            let trackable_item = this.list.find(i => i.item_id === item.id);
            if (trackable_item == null) {
                trackable_item = new TrackableItem(item.id);
                this.list.push(trackable_item);
            }
            trackable_item.characterAdd(character_id, item.quantity);
        }
        characterMerge(id, list) {
            for (const mat of list.materials) {
                let item = this.list.find(i => i.item_id === mat.id);
                if (item == null) {
                    item = new TrackableItem(mat.id);
                    this.list.push(item);
                }
                item.characterAdd(id, mat.quantity);
            }
        }
        weaponMerge(id, list) {
            for (const mat of list.materials) {
                let item = this.list.find(i => i.item_id === mat.id);
                if (item == null) {
                    item = new TrackableItem(mat.id);
                    this.list.push(item);
                }
                item.weaponAdd(id, mat.quantity);
            }
        }
        filterOutZeroes() {
            this.list = this.list.filter(i => i.quantity > 0);
        }
    }
    class TrackableCost {
        constructor() {
            this.mora = new TrackableItem(0);
            this.character_exp = new TrackableItem(25);
            this.weapon_exp = new TrackableItem(57);
            this.common = new TrackableList();
            this.elite = new TrackableList();
            this.gem = new TrackableList();
            this.book = new TrackableList();
            this.wam = new TrackableList();
            this.local_specialty = new TrackableList();
            this.ascension_boss = new TrackableList();
            this.talent_boss = new TrackableList();
            this.crown = new TrackableItem(1504);
        }
        find(id) {
            if (id === this.mora.item_id)
                return this.mora;
            if (id === this.character_exp.item_id)
                return this.character_exp;
            if (id === this.weapon_exp.item_id)
                return this.weapon_exp;
            if (id === this.crown.item_id)
                return this.crown;
            let item = this.common.list.find(i => i.item_id === id);
            if (item != null)
                return item;
            item = this.elite.list.find(i => i.item_id === id);
            if (item != null)
                return item;
            item = this.gem.list.find(i => i.item_id === id);
            if (item != null)
                return item;
            item = this.book.list.find(i => i.item_id === id);
            if (item != null)
                return item;
            item = this.wam.list.find(i => i.item_id === id);
            if (item != null)
                return item;
            item = this.local_specialty.list.find(i => i.item_id === id);
            if (item != null)
                return item;
            item = this.ascension_boss.list.find(i => i.item_id === id);
            if (item != null)
                return item;
            item = this.talent_boss.list.find(i => i.item_id === id);
            if (item != null)
                return item;
            return null;
        }
        findForCharacter(id) {
            const list = [];
            if (this.mora.characters_id.includes(id))
                list.push(this.mora);
            if (this.character_exp.characters_id.includes(id))
                list.push(this.character_exp);
            if (this.crown.characters_id.includes(id))
                list.push(this.crown);
            list.push(...this.common.list.filter(i => i.characters_id.includes(id)));
            list.push(...this.gem.list.filter(i => i.characters_id.includes(id)));
            list.push(...this.book.list.filter(i => i.characters_id.includes(id)));
            list.push(...this.local_specialty.list.filter(i => i.characters_id.includes(id)));
            list.push(...this.ascension_boss.list.filter(i => i.characters_id.includes(id)));
            list.push(...this.talent_boss.list.filter(i => i.characters_id.includes(id)));
            return list;
        }
        findForWeapon(id) {
            const list = [];
            if (this.mora.weapons_id.includes(id))
                list.push(this.mora);
            if (this.weapon_exp.weapons_id.includes(id))
                list.push(this.weapon_exp);
            list.push(...this.common.list.filter(i => i.weapons_id.includes(id)));
            list.push(...this.elite.list.filter(i => i.weapons_id.includes(id)));
            list.push(...this.wam.list.filter(i => i.weapons_id.includes(id)));
            return list;
        }
        filterOutZeroes() {
            this.common.filterOutZeroes();
            this.elite.filterOutZeroes();
            this.gem.filterOutZeroes();
            this.book.filterOutZeroes();
            this.wam.filterOutZeroes();
            this.local_specialty.filterOutZeroes();
            this.ascension_boss.filterOutZeroes();
            this.talent_boss.filterOutZeroes();
        }
    }
    function calculateTrackable(build_conf) {
        const cost = new TrackableCost();
        for (const char_conf of build_conf.char_build) {
            const char_cost = characterCost(char_conf);
            console.log(char_conf, char_cost);
            cost.mora.characterAdd(char_conf.id, char_cost.mora);
            cost.character_exp.characterAdd(char_conf.id, char_cost.experience);
            cost.crown.characterAdd(char_conf.id, char_cost.crown);
            cost.common.characterMerge(char_conf.id, char_cost.common);
            cost.gem.characterMerge(char_conf.id, char_cost.gem);
            cost.book.characterMerge(char_conf.id, char_cost.book);
            cost.local_specialty.characterAdd(char_conf.id, char_cost.local_specialty);
            cost.talent_boss.characterMerge(char_conf.id, char_cost.talent_boss);
            if (char_cost.ascension_boss.id != null) // traveler
                cost.ascension_boss.characterAdd(char_conf.id, char_cost.ascension_boss);
        }
        for (const weap_conf of build_conf.weap_build) {
            const weap_cost = weaponCost(weap_conf);
            cost.mora.weaponAdd(weap_conf.id, weap_cost.mora);
            cost.weapon_exp.weaponAdd(weap_conf.id, weap_cost.experience);
            cost.common.weaponMerge(weap_conf.id, weap_cost.common);
            cost.wam.weaponMerge(weap_conf.id, weap_cost.wam);
            cost.elite.weaponMerge(weap_conf.id, weap_cost.elite);
        }
        cost.mora.quantity += Math.ceil(cost.character_exp.quantity / 5);
        cost.mora.quantity += Math.ceil(cost.weapon_exp.quantity / 10);
        cost.filterOutZeroes();
        return cost;
    }

    class SubscriberManager {
        constructor() {
            this.subs = new Set();
        }
        get length() {
            return this.subs.size;
        }
        subscribe(sub) {
            this.subs.add(sub);
        }
        unsubscribe(sub) {
            this.subs.delete(sub);
        }
        notify(value) {
            this.subs.forEach(sub => sub(value));
        }
    }

    function localStorageStore(key, value, start, config) {
        const subs = new SubscriberManager();
        (() => {
            let stored = localStorage.getItem(key);
            if (stored) {
                value = config != null ? config.parse(stored) : JSON.parse(stored);
            }
            else {
                localStorage.setItem(key, config != null ? config.stringify(value) : JSON.stringify(value));
            }
        })();
        return {
            set,
            subscribe,
            update: (updater) => void (set(updater(value))),
        };
        function set(newValue) {
            if (newValue === value)
                return;
            value = newValue;
            localStorage.setItem(key, config != null ? config.stringify(value) : JSON.stringify(value));
            subs.notify(value);
        }
        function subscribe(sub) {
            let emptyNotifier = undefined;
            if (subs.length === 0)
                emptyNotifier = start === null || start === void 0 ? void 0 : start.call(undefined, set);
            subs.subscribe(sub);
            sub(value);
            return () => {
                subs.unsubscribe(sub);
                if (subs.length === 0) {
                    emptyNotifier === null || emptyNotifier === void 0 ? void 0 : emptyNotifier.call();
                    emptyNotifier = undefined;
                }
            };
        }
    }

    function isSimpleTalentConfig(talent) {
        return 'basic_talent' in talent;
    }
    function highlightThingStore() {
        const store = writable(null);
        return {
            subscribe: store.subscribe,
            select(what, id) {
                store.update(last => {
                    if ((last === null || last === void 0 ? void 0 : last.id) === id && (last === null || last === void 0 ? void 0 : last.what) === what)
                        return null;
                    return { what, id };
                });
            },
            clear() {
                store.set(null);
            }
        };
    }
    const build_list = localStorageStore('build_config', []);
    const build_index = localStorageStore('selected_build_index', null);
    const selected_build = derived([build_list, build_index], ([$build_list, $build_index], set) => {
        if ($build_index == null || $build_index < 0 || $build_index >= $build_list.length) {
            set(null);
        }
        set($build_list[$build_index]);
    });
    const cost = derived(selected_build, $selected_build => $selected_build != null ? calculateTrackable($selected_build) : null);
    const highlight = highlightThingStore();
    const highlight_manager = derived([cost, highlight], ([$cost, $highlight], set) => {
        const always_false = () => false;
        if ($cost == null || $highlight == null) {
            set({
                isSelected: always_false,
            });
            return;
        }
        let rec;
        switch ($highlight.what) {
            case 'item':
                const item = $cost.find($highlight.id);
                if (item != null) {
                    rec = {
                        character: item.characters_id,
                        item: [item.item_id],
                        weapon: item.weapons_id,
                    };
                }
                break;
            case 'character':
                rec = {
                    character: [$highlight.id],
                    item: $cost.findForCharacter($highlight.id).map(i => i.item_id),
                    weapon: [],
                };
                break;
            case 'weapon':
                rec = {
                    weapon: [$highlight.id],
                    item: $cost.findForWeapon($highlight.id).map(i => i.item_id),
                    character: [],
                };
                break;
        }
        set({ isSelected: rec == null ? always_false : (t, id) => rec[t].includes(id), });
    });

    /* src\CharacterDialog.svelte generated by Svelte v3.55.1 */

    const { Object: Object_1$3 } = globals;
    const file$a = "src\\CharacterDialog.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i][0];
    	child_ctx[25] = list[i][1];
    	child_ctx[26] = list;
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    // (136:12) {#if character.id == null}
    function create_if_block_2(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value_2 = /*available_characters*/ ctx[3];
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*char*/ ctx[30].name;
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "horizontal-list svelte-1h1we34");
    			add_location(div, file$a, 136, 16, 4586);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*available_characters, character*/ 9) {
    				each_value_2 = /*available_characters*/ ctx[3];
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, div, destroy_block, create_each_block_2, null, get_each_context_2);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(136:12) {#if character.id == null}",
    		ctx
    	});

    	return block;
    }

    // (138:20) {#each available_characters as char (char.name)}
    function create_each_block_2(key_1, ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t;
    	let button_disabled_value;
    	let button_title_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[9](/*char*/ ctx[30]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			t = space();
    			if (!src_url_equal(img.src, img_src_value = /*char*/ ctx[30].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*char*/ ctx[30].name);
    			add_location(img, file$a, 150, 28, 5340);
    			button.disabled = button_disabled_value = /*char*/ ctx[30].name === /*character*/ ctx[0].name;
    			attr_dev(button, "title", button_title_value = /*char*/ ctx[30].name);
    			toggle_class(button, "active", /*char*/ ctx[30].name === /*character*/ ctx[0].name);
    			add_location(button, file$a, 138, 24, 4711);
    			this.first = button;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*available_characters*/ 8 && !src_url_equal(img.src, img_src_value = /*char*/ ctx[30].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*available_characters*/ 8 && img_alt_value !== (img_alt_value = /*char*/ ctx[30].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty[0] & /*available_characters, character*/ 9 && button_disabled_value !== (button_disabled_value = /*char*/ ctx[30].name === /*character*/ ctx[0].name)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty[0] & /*available_characters*/ 8 && button_title_value !== (button_title_value = /*char*/ ctx[30].name)) {
    				attr_dev(button, "title", button_title_value);
    			}

    			if (dirty[0] & /*available_characters, character*/ 9) {
    				toggle_class(button, "active", /*char*/ ctx[30].name === /*character*/ ctx[0].name);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(138:20) {#each available_characters as char (char.name)}",
    		ctx
    	});

    	return block;
    }

    // (192:12) {:else}
    function create_else_block$1(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let current;
    	let each_value_1 = Object.keys(/*character*/ ctx[0].talent);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = Object.entries(/*character*/ ctx[0].talent);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "tabs svelte-1h1we34");
    			add_location(div0, file$a, 193, 20, 7218);
    			attr_dev(div1, "class", "talent-panel tab-panel svelte-1h1we34");
    			add_location(div1, file$a, 192, 16, 7160);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div1, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*character, open_tab*/ 5) {
    				each_value_1 = Object.keys(/*character*/ ctx[0].talent);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*character, open_tab*/ 5) {
    				each_value = Object.entries(/*character*/ ctx[0].talent);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(192:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (173:12) {#if isSimpleTalentConfig(character.talent)}
    function create_if_block_1$2(ctx) {
    	let div;
    	let p;
    	let t1;
    	let autocompleteinput0;
    	let updating_value;
    	let t2;
    	let autocompleteinput1;
    	let updating_value_1;
    	let t3;
    	let autocompleteinput2;
    	let updating_value_2;
    	let current;

    	function autocompleteinput0_value_binding_1(value) {
    		/*autocompleteinput0_value_binding_1*/ ctx[12](value);
    	}

    	let autocompleteinput0_props = {
    		name: "basic_talent",
    		placeholder: "Basic talent level (<start>/<end>)",
    		items: talent_options
    	};

    	if (/*character*/ ctx[0].talent.basic_talent !== void 0) {
    		autocompleteinput0_props.value = /*character*/ ctx[0].talent.basic_talent;
    	}

    	autocompleteinput0 = new AutocompleteInput({
    			props: autocompleteinput0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocompleteinput0, 'value', autocompleteinput0_value_binding_1));

    	function autocompleteinput1_value_binding_1(value) {
    		/*autocompleteinput1_value_binding_1*/ ctx[13](value);
    	}

    	let autocompleteinput1_props = {
    		name: "elemental_talent",
    		placeholder: "Elemental talent level (<start>/<end>)",
    		items: talent_options
    	};

    	if (/*character*/ ctx[0].talent.elemental_talent !== void 0) {
    		autocompleteinput1_props.value = /*character*/ ctx[0].talent.elemental_talent;
    	}

    	autocompleteinput1 = new AutocompleteInput({
    			props: autocompleteinput1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocompleteinput1, 'value', autocompleteinput1_value_binding_1));

    	function autocompleteinput2_value_binding(value) {
    		/*autocompleteinput2_value_binding*/ ctx[14](value);
    	}

    	let autocompleteinput2_props = {
    		name: "burst_talent",
    		placeholder: "Burst talent level (<start>/<end>)",
    		items: talent_options
    	};

    	if (/*character*/ ctx[0].talent.burst_talent !== void 0) {
    		autocompleteinput2_props.value = /*character*/ ctx[0].talent.burst_talent;
    	}

    	autocompleteinput2 = new AutocompleteInput({
    			props: autocompleteinput2_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocompleteinput2, 'value', autocompleteinput2_value_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Talent";
    			t1 = space();
    			create_component(autocompleteinput0.$$.fragment);
    			t2 = space();
    			create_component(autocompleteinput1.$$.fragment);
    			t3 = space();
    			create_component(autocompleteinput2.$$.fragment);
    			attr_dev(p, "class", "svelte-1h1we34");
    			add_location(p, file$a, 174, 20, 6238);
    			attr_dev(div, "class", "talent-panel svelte-1h1we34");
    			add_location(div, file$a, 173, 16, 6190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(div, t1);
    			mount_component(autocompleteinput0, div, null);
    			append_dev(div, t2);
    			mount_component(autocompleteinput1, div, null);
    			append_dev(div, t3);
    			mount_component(autocompleteinput2, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const autocompleteinput0_changes = {};

    			if (!updating_value && dirty[0] & /*character*/ 1) {
    				updating_value = true;
    				autocompleteinput0_changes.value = /*character*/ ctx[0].talent.basic_talent;
    				add_flush_callback(() => updating_value = false);
    			}

    			autocompleteinput0.$set(autocompleteinput0_changes);
    			const autocompleteinput1_changes = {};

    			if (!updating_value_1 && dirty[0] & /*character*/ 1) {
    				updating_value_1 = true;
    				autocompleteinput1_changes.value = /*character*/ ctx[0].talent.elemental_talent;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			autocompleteinput1.$set(autocompleteinput1_changes);
    			const autocompleteinput2_changes = {};

    			if (!updating_value_2 && dirty[0] & /*character*/ 1) {
    				updating_value_2 = true;
    				autocompleteinput2_changes.value = /*character*/ ctx[0].talent.burst_talent;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			autocompleteinput2.$set(autocompleteinput2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(autocompleteinput0.$$.fragment, local);
    			transition_in(autocompleteinput1.$$.fragment, local);
    			transition_in(autocompleteinput2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(autocompleteinput0.$$.fragment, local);
    			transition_out(autocompleteinput1.$$.fragment, local);
    			transition_out(autocompleteinput2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(autocompleteinput0);
    			destroy_component(autocompleteinput1);
    			destroy_component(autocompleteinput2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(173:12) {#if isSimpleTalentConfig(character.talent)}",
    		ctx
    	});

    	return block;
    }

    // (195:24) {#each Object.keys(character.talent) as element}
    function create_each_block_1$1(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t;
    	let button_title_value;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function func(...args) {
    		return /*func*/ ctx[15](/*element*/ ctx[24], ...args);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[16](/*element*/ ctx[24]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			t = space();
    			if (!src_url_equal(img.src, img_src_value = genshin_data.elements.find(func)?.image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*element*/ ctx[24]);
    			attr_dev(img, "class", "svelte-1h1we34");
    			add_location(img, file$a, 202, 32, 7729);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "title", button_title_value = /*element*/ ctx[24]);
    			attr_dev(button, "class", "icon");
    			button.disabled = button_disabled_value = /*open_tab*/ ctx[2] === /*element*/ ctx[24];
    			toggle_class(button, "active", /*open_tab*/ ctx[2] === /*element*/ ctx[24]);
    			add_location(button, file$a, 195, 28, 7340);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*character*/ 1 && !src_url_equal(img.src, img_src_value = genshin_data.elements.find(func)?.image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*character*/ 1 && img_alt_value !== (img_alt_value = /*element*/ ctx[24])) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty[0] & /*character*/ 1 && button_title_value !== (button_title_value = /*element*/ ctx[24])) {
    				attr_dev(button, "title", button_title_value);
    			}

    			if (dirty[0] & /*open_tab, character*/ 5 && button_disabled_value !== (button_disabled_value = /*open_tab*/ ctx[2] === /*element*/ ctx[24])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty[0] & /*open_tab, character*/ 5) {
    				toggle_class(button, "active", /*open_tab*/ ctx[2] === /*element*/ ctx[24]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(195:24) {#each Object.keys(character.talent) as element}",
    		ctx
    	});

    	return block;
    }

    // (212:20) {#each Object.entries(character.talent) as [element, talent]}
    function create_each_block$5(ctx) {
    	let div;
    	let autocompleteinput0;
    	let updating_value;
    	let t0;
    	let autocompleteinput1;
    	let updating_value_1;
    	let t1;
    	let autocompleteinput2;
    	let updating_value_2;
    	let t2;
    	let current;

    	function autocompleteinput0_value_binding_2(value) {
    		/*autocompleteinput0_value_binding_2*/ ctx[17](value, /*talent*/ ctx[25]);
    	}

    	let autocompleteinput0_props = {
    		name: "basic_talent",
    		placeholder: "Basic talent level (<start>/<end>)",
    		items: talent_options
    	};

    	if (/*talent*/ ctx[25].basic_talent !== void 0) {
    		autocompleteinput0_props.value = /*talent*/ ctx[25].basic_talent;
    	}

    	autocompleteinput0 = new AutocompleteInput({
    			props: autocompleteinput0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocompleteinput0, 'value', autocompleteinput0_value_binding_2));

    	function autocompleteinput1_value_binding_2(value) {
    		/*autocompleteinput1_value_binding_2*/ ctx[18](value, /*talent*/ ctx[25]);
    	}

    	let autocompleteinput1_props = {
    		name: "elemental_talent",
    		placeholder: "Elemental talent level (<start>/<end>)",
    		items: talent_options
    	};

    	if (/*talent*/ ctx[25].elemental_talent !== void 0) {
    		autocompleteinput1_props.value = /*talent*/ ctx[25].elemental_talent;
    	}

    	autocompleteinput1 = new AutocompleteInput({
    			props: autocompleteinput1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocompleteinput1, 'value', autocompleteinput1_value_binding_2));

    	function autocompleteinput2_value_binding_1(value) {
    		/*autocompleteinput2_value_binding_1*/ ctx[19](value, /*talent*/ ctx[25]);
    	}

    	let autocompleteinput2_props = {
    		name: "burst_talent",
    		placeholder: "Burst talent level (<start>/<end>)",
    		items: talent_options
    	};

    	if (/*talent*/ ctx[25].burst_talent !== void 0) {
    		autocompleteinput2_props.value = /*talent*/ ctx[25].burst_talent;
    	}

    	autocompleteinput2 = new AutocompleteInput({
    			props: autocompleteinput2_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocompleteinput2, 'value', autocompleteinput2_value_binding_1));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(autocompleteinput0.$$.fragment);
    			t0 = space();
    			create_component(autocompleteinput1.$$.fragment);
    			t1 = space();
    			create_component(autocompleteinput2.$$.fragment);
    			t2 = space();
    			attr_dev(div, "class", "panel svelte-1h1we34");
    			toggle_class(div, "open", /*element*/ ctx[24] === /*open_tab*/ ctx[2]);
    			add_location(div, file$a, 212, 24, 8189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(autocompleteinput0, div, null);
    			append_dev(div, t0);
    			mount_component(autocompleteinput1, div, null);
    			append_dev(div, t1);
    			mount_component(autocompleteinput2, div, null);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const autocompleteinput0_changes = {};

    			if (!updating_value && dirty[0] & /*character*/ 1) {
    				updating_value = true;
    				autocompleteinput0_changes.value = /*talent*/ ctx[25].basic_talent;
    				add_flush_callback(() => updating_value = false);
    			}

    			autocompleteinput0.$set(autocompleteinput0_changes);
    			const autocompleteinput1_changes = {};

    			if (!updating_value_1 && dirty[0] & /*character*/ 1) {
    				updating_value_1 = true;
    				autocompleteinput1_changes.value = /*talent*/ ctx[25].elemental_talent;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			autocompleteinput1.$set(autocompleteinput1_changes);
    			const autocompleteinput2_changes = {};

    			if (!updating_value_2 && dirty[0] & /*character*/ 1) {
    				updating_value_2 = true;
    				autocompleteinput2_changes.value = /*talent*/ ctx[25].burst_talent;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			autocompleteinput2.$set(autocompleteinput2_changes);

    			if (!current || dirty[0] & /*character, open_tab*/ 5) {
    				toggle_class(div, "open", /*element*/ ctx[24] === /*open_tab*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(autocompleteinput0.$$.fragment, local);
    			transition_in(autocompleteinput1.$$.fragment, local);
    			transition_in(autocompleteinput2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(autocompleteinput0.$$.fragment, local);
    			transition_out(autocompleteinput1.$$.fragment, local);
    			transition_out(autocompleteinput2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(autocompleteinput0);
    			destroy_component(autocompleteinput1);
    			destroy_component(autocompleteinput2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(212:20) {#each Object.entries(character.talent) as [element, talent]}",
    		ctx
    	});

    	return block;
    }

    // (236:12) {#if character.id != null}
    function create_if_block$7(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "button");
    			input.value = "Delete";
    			attr_dev(input, "class", "svelte-1h1we34");
    			add_location(input, file$a, 236, 16, 9388);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", /*deleteCharacter*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(236:12) {#if character.id != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let dialog_1;
    	let form;
    	let div0;
    	let icon0;
    	let t0;
    	let p0;
    	let t2;
    	let button;
    	let icon1;
    	let t3;
    	let div3;
    	let p1;
    	let t4_value = /*character*/ ctx[0].name + "";
    	let t4;
    	let t5;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_title_value;
    	let t6;
    	let t7;
    	let div1;
    	let autocompleteinput0;
    	let updating_value;
    	let t8;
    	let div2;
    	let autocompleteinput1;
    	let updating_value_1;
    	let t9;
    	let show_if;
    	let current_block_type_index;
    	let if_block1;
    	let t10;
    	let div4;
    	let t11;
    	let input0;
    	let t12;
    	let input1;
    	let current;
    	let mounted;
    	let dispose;

    	icon0 = new Icon({
    			props: { icon: "user-plus", size: "2rem" },
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: { icon: "cross", size: "2rem" },
    			$$inline: true
    		});

    	let if_block0 = /*character*/ ctx[0].id == null && create_if_block_2(ctx);

    	function autocompleteinput0_value_binding(value) {
    		/*autocompleteinput0_value_binding*/ ctx[10](value);
    	}

    	let autocompleteinput0_props = {
    		name: "level_start",
    		items: level_options$1,
    		placeholder: "Start level (<level>/<cap>)"
    	};

    	if (/*character*/ ctx[0].level_start !== void 0) {
    		autocompleteinput0_props.value = /*character*/ ctx[0].level_start;
    	}

    	autocompleteinput0 = new AutocompleteInput({
    			props: autocompleteinput0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocompleteinput0, 'value', autocompleteinput0_value_binding));

    	function autocompleteinput1_value_binding(value) {
    		/*autocompleteinput1_value_binding*/ ctx[11](value);
    	}

    	let autocompleteinput1_props = {
    		name: "level_end",
    		placeholder: "End level (<level>/<cap>)",
    		items: filteredCombination$1(/*character*/ ctx[0].level_start)
    	};

    	if (/*character*/ ctx[0].level_end !== void 0) {
    		autocompleteinput1_props.value = /*character*/ ctx[0].level_end;
    	}

    	autocompleteinput1 = new AutocompleteInput({
    			props: autocompleteinput1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocompleteinput1, 'value', autocompleteinput1_value_binding));
    	const if_block_creators = [create_if_block_1$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty[0] & /*character*/ 1) show_if = null;
    		if (show_if == null) show_if = !!isSimpleTalentConfig(/*character*/ ctx[0].talent);
    		if (show_if) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx, [-1, -1]);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block2 = /*character*/ ctx[0].id != null && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			dialog_1 = element("dialog");
    			form = element("form");
    			div0 = element("div");
    			create_component(icon0.$$.fragment);
    			t0 = space();
    			p0 = element("p");
    			p0.textContent = "Character Build Creation";
    			t2 = space();
    			button = element("button");
    			create_component(icon1.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			p1 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			img = element("img");
    			t6 = space();
    			if (if_block0) if_block0.c();
    			t7 = space();
    			div1 = element("div");
    			create_component(autocompleteinput0.$$.fragment);
    			t8 = space();
    			div2 = element("div");
    			create_component(autocompleteinput1.$$.fragment);
    			t9 = space();
    			if_block1.c();
    			t10 = space();
    			div4 = element("div");
    			if (if_block2) if_block2.c();
    			t11 = space();
    			input0 = element("input");
    			t12 = space();
    			input1 = element("input");
    			attr_dev(p0, "class", "svelte-1h1we34");
    			add_location(p0, file$a, 116, 12, 3987);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "icon svelte-1h1we34");
    			attr_dev(button, "tabindex", "-1");
    			add_location(button, file$a, 117, 12, 4032);
    			attr_dev(div0, "class", "header svelte-1h1we34");
    			add_location(div0, file$a, 114, 8, 3902);
    			attr_dev(p1, "class", "name svelte-1h1we34");
    			add_location(p1, file$a, 127, 12, 4315);
    			attr_dev(img, "class", "thumbnail svelte-1h1we34");
    			if (!src_url_equal(img.src, img_src_value = /*character*/ ctx[0].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*character*/ ctx[0].name);
    			attr_dev(img, "title", img_title_value = /*character*/ ctx[0].name);
    			add_location(img, file$a, 129, 12, 4367);
    			attr_dev(div1, "class", "level_start svelte-1h1we34");
    			add_location(div1, file$a, 156, 12, 5503);
    			attr_dev(div2, "class", "level_end svelte-1h1we34");
    			add_location(div2, file$a, 164, 12, 5805);
    			attr_dev(div3, "class", "body svelte-1h1we34");
    			add_location(div3, file$a, 126, 8, 4283);
    			attr_dev(input0, "type", "submit");
    			input0.value = "Submit";
    			attr_dev(input0, "class", "svelte-1h1we34");
    			add_location(input0, file$a, 241, 12, 9549);
    			attr_dev(input1, "type", "button");
    			input1.value = "Cancel";
    			attr_dev(input1, "class", "svelte-1h1we34");
    			add_location(input1, file$a, 242, 12, 9601);
    			attr_dev(div4, "class", "footer svelte-1h1we34");
    			add_location(div4, file$a, 234, 8, 9310);
    			attr_dev(form, "method", "dialog");
    			attr_dev(form, "class", "svelte-1h1we34");
    			add_location(form, file$a, 113, 4, 3842);
    			add_location(dialog_1, file$a, 112, 0, 3809);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dialog_1, anchor);
    			append_dev(dialog_1, form);
    			append_dev(form, div0);
    			mount_component(icon0, div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, p0);
    			append_dev(div0, t2);
    			append_dev(div0, button);
    			mount_component(icon1, button, null);
    			append_dev(form, t3);
    			append_dev(form, div3);
    			append_dev(div3, p1);
    			append_dev(p1, t4);
    			append_dev(div3, t5);
    			append_dev(div3, img);
    			append_dev(div3, t6);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t7);
    			append_dev(div3, div1);
    			mount_component(autocompleteinput0, div1, null);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			mount_component(autocompleteinput1, div2, null);
    			append_dev(div3, t9);
    			if_blocks[current_block_type_index].m(div3, null);
    			append_dev(form, t10);
    			append_dev(form, div4);
    			if (if_block2) if_block2.m(div4, null);
    			append_dev(div4, t11);
    			append_dev(div4, input0);
    			append_dev(div4, t12);
    			append_dev(div4, input1);
    			/*dialog_1_binding*/ ctx[21](dialog_1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(input1, "click", /*click_handler_3*/ ctx[20], false, false, false),
    					listen_dev(form, "submit", /*submitCharacter*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*character*/ 1) && t4_value !== (t4_value = /*character*/ ctx[0].name + "")) set_data_dev(t4, t4_value);

    			if (!current || dirty[0] & /*character*/ 1 && !src_url_equal(img.src, img_src_value = /*character*/ ctx[0].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*character*/ 1 && img_alt_value !== (img_alt_value = /*character*/ ctx[0].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (!current || dirty[0] & /*character*/ 1 && img_title_value !== (img_title_value = /*character*/ ctx[0].name)) {
    				attr_dev(img, "title", img_title_value);
    			}

    			if (/*character*/ ctx[0].id == null) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div3, t7);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			const autocompleteinput0_changes = {};

    			if (!updating_value && dirty[0] & /*character*/ 1) {
    				updating_value = true;
    				autocompleteinput0_changes.value = /*character*/ ctx[0].level_start;
    				add_flush_callback(() => updating_value = false);
    			}

    			autocompleteinput0.$set(autocompleteinput0_changes);
    			const autocompleteinput1_changes = {};
    			if (dirty[0] & /*character*/ 1) autocompleteinput1_changes.items = filteredCombination$1(/*character*/ ctx[0].level_start);

    			if (!updating_value_1 && dirty[0] & /*character*/ 1) {
    				updating_value_1 = true;
    				autocompleteinput1_changes.value = /*character*/ ctx[0].level_end;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			autocompleteinput1.$set(autocompleteinput1_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div3, null);
    			}

    			if (/*character*/ ctx[0].id != null) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$7(ctx);
    					if_block2.c();
    					if_block2.m(div4, t11);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(autocompleteinput0.$$.fragment, local);
    			transition_in(autocompleteinput1.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(autocompleteinput0.$$.fragment, local);
    			transition_out(autocompleteinput1.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dialog_1);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			if (if_block0) if_block0.d();
    			destroy_component(autocompleteinput0);
    			destroy_component(autocompleteinput1);
    			if_blocks[current_block_type_index].d();
    			if (if_block2) if_block2.d();
    			/*dialog_1_binding*/ ctx[21](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function generateTalentCombination() {
    	const options = [];

    	for (let start = 1; start <= 10; start++) {
    		for (let end = start; end <= 10; end++) {
    			options.push(`${start}/${end}`);
    		} // if (end < 10) {
    		//     options.push(`0${start}/${end}`);
    	} //     options.push(`0${start}/0${end}`);
    	// } else if (start < 10) {

    	//     options.push(`0${start}/${end}`);
    	// }
    	return options;
    }

    function generateLevelCombination$1() {
    	const options = [];

    	for (let level = 1; level <= 90; level++) {
    		const cap = genshin_data.levelBarriers.find(b => level <= b);
    		options.push(`${level}/${cap}`);

    		if (level < 10) ; else if (level === cap && level < 90) {
    			options.push(`${level}/${genshin_data.levelBarriers.find(b => level < b)}`); // options.push(`0${level}/${cap}`);
    		}
    	}

    	return options;
    }

    function filteredCombination$1(value) {
    	if (!level_options$1.includes(value)) return level_options$1;
    	const [start, end] = value.split("/").map(v => parseInt(v));

    	return level_options$1.filter(lo => {
    		const [low, high] = lo.split("/").map(v => parseInt(v));
    		return low >= start && high >= end;
    	});
    }

    function changeTalent(character, talent) {
    	if (isSimpleTalent(character.talentAscension)) {
    		if (!isSimpleTalentConfig(talent)) {
    			return Object.values(talent)[0];
    		}
    	} else {
    		if (isSimpleTalentConfig(talent)) {
    			return Object.fromEntries(Object.keys(character.talentAscension).filter(k => genshin_data.elements.some(e => e.description === k)).map(k => [k, talent]));
    		}
    	}

    	return talent;
    }

    const level_options$1 = generateLevelCombination$1();
    const talent_options = generateTalentCombination();

    const empty_character = {
    	image: "",
    	level_end: "",
    	level_start: "",
    	name: "",
    	talent: {
    		basic_talent: "",
    		elemental_talent: "",
    		burst_talent: ""
    	}
    };

    function instance$a($$self, $$props, $$invalidate) {
    	let available_characters;
    	let $selected_build;
    	let $build_list;
    	validate_store(selected_build, 'selected_build');
    	component_subscribe($$self, selected_build, $$value => $$invalidate(7, $selected_build = $$value));
    	validate_store(build_list, 'build_list');
    	component_subscribe($$self, build_list, $$value => $$invalidate(22, $build_list = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CharacterDialog', slots, []);
    	const dispatch = createEventDispatcher();
    	let character = empty_character;
    	let dialog;
    	let open_tab = null;

    	function deleteCharacter() {
    		const index = $selected_build.char_build.findIndex(w => w.id === character.id);

    		if (index >= 0) {
    			$selected_build.char_build.splice(index, 1);
    			set_store_value(selected_build, $selected_build.char_build = [...$selected_build.char_build], $selected_build);
    			set_store_value(build_list, $build_list = [...$build_list], $build_list);
    		}

    		dialog.close();
    	}

    	function open(data) {
    		if (data != null) {
    			$$invalidate(0, character = deepClone(data));
    		} else {
    			$$invalidate(0, character = deepClone(empty_character));
    			$$invalidate(0, character.name = available_characters[0].name, character);
    			$$invalidate(0, character.image = available_characters[0].image, character);
    		}

    		dialog.showModal();
    	}

    	function submitCharacter() {
    		dispatch("create", character);
    		dialog.close();
    	}

    	const writable_props = [];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CharacterDialog> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dialog.close();

    	const click_handler_1 = char => {
    		$$invalidate(0, character.image = char.image, character);
    		$$invalidate(0, character.name = char.name, character);
    		$$invalidate(0, character.talent = changeTalent(char, character.talent), character);
    	};

    	function autocompleteinput0_value_binding(value) {
    		if ($$self.$$.not_equal(character.level_start, value)) {
    			character.level_start = value;
    			$$invalidate(0, character);
    		}
    	}

    	function autocompleteinput1_value_binding(value) {
    		if ($$self.$$.not_equal(character.level_end, value)) {
    			character.level_end = value;
    			$$invalidate(0, character);
    		}
    	}

    	function autocompleteinput0_value_binding_1(value) {
    		if ($$self.$$.not_equal(character.talent.basic_talent, value)) {
    			character.talent.basic_talent = value;
    			$$invalidate(0, character);
    		}
    	}

    	function autocompleteinput1_value_binding_1(value) {
    		if ($$self.$$.not_equal(character.talent.elemental_talent, value)) {
    			character.talent.elemental_talent = value;
    			$$invalidate(0, character);
    		}
    	}

    	function autocompleteinput2_value_binding(value) {
    		if ($$self.$$.not_equal(character.talent.burst_talent, value)) {
    			character.talent.burst_talent = value;
    			$$invalidate(0, character);
    		}
    	}

    	const func = (element, e) => e.description === element;
    	const click_handler_2 = element => $$invalidate(2, open_tab = element);

    	function autocompleteinput0_value_binding_2(value, talent) {
    		if ($$self.$$.not_equal(talent.basic_talent, value)) {
    			talent.basic_talent = value;
    		}
    	}

    	function autocompleteinput1_value_binding_2(value, talent) {
    		if ($$self.$$.not_equal(talent.elemental_talent, value)) {
    			talent.elemental_talent = value;
    		}
    	}

    	function autocompleteinput2_value_binding_1(value, talent) {
    		if ($$self.$$.not_equal(talent.burst_talent, value)) {
    			talent.burst_talent = value;
    		}
    	}

    	const click_handler_3 = () => dialog.close();

    	function dialog_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			dialog = $$value;
    			$$invalidate(1, dialog);
    		});
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		genshin_data,
    		AutocompleteInput,
    		Icon,
    		isSimpleTalent,
    		generateTalentCombination,
    		generateLevelCombination: generateLevelCombination$1,
    		filteredCombination: filteredCombination$1,
    		changeTalent,
    		level_options: level_options$1,
    		talent_options,
    		empty_character,
    		deepClone,
    		build_list,
    		isSimpleTalentConfig,
    		selected_build,
    		dispatch,
    		character,
    		dialog,
    		open_tab,
    		deleteCharacter,
    		open,
    		submitCharacter,
    		available_characters,
    		$selected_build,
    		$build_list
    	});

    	$$self.$inject_state = $$props => {
    		if ('character' in $$props) $$invalidate(0, character = $$props.character);
    		if ('dialog' in $$props) $$invalidate(1, dialog = $$props.dialog);
    		if ('open_tab' in $$props) $$invalidate(2, open_tab = $$props.open_tab);
    		if ('available_characters' in $$props) $$invalidate(3, available_characters = $$props.available_characters);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$selected_build*/ 128) {
    			$$invalidate(3, available_characters = genshin_data.character.list.filter(c1 => !$selected_build.char_build.some(c2 => c1.name === c2.name)));
    		}

    		if ($$self.$$.dirty[0] & /*character*/ 1) {
    			{
    				$$invalidate(2, open_tab = isSimpleTalentConfig(character.talent)
    				? null
    				: Object.keys(character.talent)[0]);
    			}
    		}
    	};

    	return [
    		character,
    		dialog,
    		open_tab,
    		available_characters,
    		deleteCharacter,
    		submitCharacter,
    		open,
    		$selected_build,
    		click_handler,
    		click_handler_1,
    		autocompleteinput0_value_binding,
    		autocompleteinput1_value_binding,
    		autocompleteinput0_value_binding_1,
    		autocompleteinput1_value_binding_1,
    		autocompleteinput2_value_binding,
    		func,
    		click_handler_2,
    		autocompleteinput0_value_binding_2,
    		autocompleteinput1_value_binding_2,
    		autocompleteinput2_value_binding_1,
    		click_handler_3,
    		dialog_1_binding
    	];
    }

    class CharacterDialog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { open: 6 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CharacterDialog",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get open() {
    		return this.$$.ctx[6];
    	}

    	set open(value) {
    		throw new Error("<CharacterDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\WeaponDialog.svelte generated by Svelte v3.55.1 */
    const file$9 = "src\\WeaponDialog.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (93:12) {#if weapon.id == null}
    function create_if_block_1$1(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = genshin_data.weapon.list;
    	validate_each_argument(each_value);
    	const get_key = ctx => /*weap*/ ctx[14].name;
    	validate_each_keys(ctx, each_value, get_each_context$4, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$4(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$4(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "horizontal-list svelte-1mkarbs");
    			add_location(div, file$9, 93, 16, 2975);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*genshin_data, weapon*/ 1) {
    				each_value = genshin_data.weapon.list;
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$4, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$4, null, get_each_context$4);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(93:12) {#if weapon.id == null}",
    		ctx
    	});

    	return block;
    }

    // (95:20) {#each genshin_data.weapon.list as weap (weap.name)}
    function create_each_block$4(key_1, ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let t;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[6](/*weap*/ ctx[14]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			t = space();
    			if (!src_url_equal(img.src, img_src_value = /*weap*/ ctx[14].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*weap*/ ctx[14].name);
    			add_location(img, file$9, 103, 28, 3522);
    			button.disabled = button_disabled_value = /*weap*/ ctx[14].name === /*weapon*/ ctx[0].name;
    			attr_dev(button, "title", /*weap*/ ctx[14].name);
    			toggle_class(button, "active", /*weap*/ ctx[14].name === /*weapon*/ ctx[0].name);
    			add_location(button, file$9, 95, 24, 3104);
    			this.first = button;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*weapon*/ 1 && button_disabled_value !== (button_disabled_value = /*weap*/ ctx[14].name === /*weapon*/ ctx[0].name)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty & /*genshin_data, weapon*/ 1) {
    				toggle_class(button, "active", /*weap*/ ctx[14].name === /*weapon*/ ctx[0].name);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(95:20) {#each genshin_data.weapon.list as weap (weap.name)}",
    		ctx
    	});

    	return block;
    }

    // (128:12) {#if weapon.id != null}
    function create_if_block$6(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "button");
    			input.value = "Delete";
    			attr_dev(input, "class", "svelte-1mkarbs");
    			add_location(input, file$9, 128, 16, 4370);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", /*deleteWeapon*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(128:12) {#if weapon.id != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let dialog_1;
    	let form;
    	let div0;
    	let icon0;
    	let t0;
    	let p0;
    	let t2;
    	let button;
    	let icon1;
    	let t3;
    	let div3;
    	let p1;
    	let t4_value = /*weapon*/ ctx[0].name + "";
    	let t4;
    	let t5;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_title_value;
    	let t6;
    	let t7;
    	let div1;
    	let autocompleteinput0;
    	let updating_value;
    	let t8;
    	let div2;
    	let autocompleteinput1;
    	let updating_value_1;
    	let t9;
    	let div4;
    	let t10;
    	let input0;
    	let t11;
    	let input1;
    	let current;
    	let mounted;
    	let dispose;

    	icon0 = new Icon({
    			props: { icon: "document-plus", size: "2rem" },
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: { icon: "cross", size: "2rem" },
    			$$inline: true
    		});

    	let if_block0 = /*weapon*/ ctx[0].id == null && create_if_block_1$1(ctx);

    	function autocompleteinput0_value_binding(value) {
    		/*autocompleteinput0_value_binding*/ ctx[7](value);
    	}

    	let autocompleteinput0_props = {
    		name: "level_start",
    		items: level_options,
    		placeholder: "Start level (<level>/<cap>)"
    	};

    	if (/*weapon*/ ctx[0].start !== void 0) {
    		autocompleteinput0_props.value = /*weapon*/ ctx[0].start;
    	}

    	autocompleteinput0 = new AutocompleteInput({
    			props: autocompleteinput0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocompleteinput0, 'value', autocompleteinput0_value_binding));

    	function autocompleteinput1_value_binding(value) {
    		/*autocompleteinput1_value_binding*/ ctx[8](value);
    	}

    	let autocompleteinput1_props = {
    		name: "level_end",
    		placeholder: "End level (<level>/<cap>)",
    		items: filteredCombination(/*weapon*/ ctx[0].start)
    	};

    	if (/*weapon*/ ctx[0].end !== void 0) {
    		autocompleteinput1_props.value = /*weapon*/ ctx[0].end;
    	}

    	autocompleteinput1 = new AutocompleteInput({
    			props: autocompleteinput1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocompleteinput1, 'value', autocompleteinput1_value_binding));
    	let if_block1 = /*weapon*/ ctx[0].id != null && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			dialog_1 = element("dialog");
    			form = element("form");
    			div0 = element("div");
    			create_component(icon0.$$.fragment);
    			t0 = space();
    			p0 = element("p");
    			p0.textContent = "Weapon Build Creation";
    			t2 = space();
    			button = element("button");
    			create_component(icon1.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			p1 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			img = element("img");
    			t6 = space();
    			if (if_block0) if_block0.c();
    			t7 = space();
    			div1 = element("div");
    			create_component(autocompleteinput0.$$.fragment);
    			t8 = space();
    			div2 = element("div");
    			create_component(autocompleteinput1.$$.fragment);
    			t9 = space();
    			div4 = element("div");
    			if (if_block1) if_block1.c();
    			t10 = space();
    			input0 = element("input");
    			t11 = space();
    			input1 = element("input");
    			attr_dev(p0, "class", "svelte-1mkarbs");
    			add_location(p0, file$9, 73, 12, 2394);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "icon svelte-1mkarbs");
    			attr_dev(button, "tabindex", "-1");
    			add_location(button, file$9, 74, 12, 2436);
    			attr_dev(div0, "class", "header svelte-1mkarbs");
    			add_location(div0, file$9, 71, 8, 2305);
    			attr_dev(p1, "class", "name svelte-1mkarbs");
    			add_location(p1, file$9, 84, 12, 2719);
    			attr_dev(img, "class", "thumbnail svelte-1mkarbs");
    			if (!src_url_equal(img.src, img_src_value = /*weapon*/ ctx[0].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*weapon*/ ctx[0].name);
    			attr_dev(img, "title", img_title_value = /*weapon*/ ctx[0].name);
    			add_location(img, file$9, 86, 12, 2768);
    			attr_dev(div1, "class", "level_start svelte-1mkarbs");
    			add_location(div1, file$9, 109, 12, 3685);
    			attr_dev(div2, "class", "level_end svelte-1mkarbs");
    			add_location(div2, file$9, 117, 12, 3978);
    			attr_dev(div3, "class", "body svelte-1mkarbs");
    			add_location(div3, file$9, 83, 8, 2687);
    			attr_dev(input0, "type", "submit");
    			input0.value = "Submit";
    			attr_dev(input0, "class", "svelte-1mkarbs");
    			add_location(input0, file$9, 130, 12, 4465);
    			attr_dev(input1, "type", "button");
    			input1.value = "Cancel";
    			attr_dev(input1, "class", "svelte-1mkarbs");
    			add_location(input1, file$9, 131, 12, 4517);
    			attr_dev(div4, "class", "footer svelte-1mkarbs");
    			add_location(div4, file$9, 126, 8, 4295);
    			attr_dev(form, "method", "dialog");
    			attr_dev(form, "class", "svelte-1mkarbs");
    			add_location(form, file$9, 70, 4, 2248);
    			add_location(dialog_1, file$9, 69, 0, 2215);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dialog_1, anchor);
    			append_dev(dialog_1, form);
    			append_dev(form, div0);
    			mount_component(icon0, div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, p0);
    			append_dev(div0, t2);
    			append_dev(div0, button);
    			mount_component(icon1, button, null);
    			append_dev(form, t3);
    			append_dev(form, div3);
    			append_dev(div3, p1);
    			append_dev(p1, t4);
    			append_dev(div3, t5);
    			append_dev(div3, img);
    			append_dev(div3, t6);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t7);
    			append_dev(div3, div1);
    			mount_component(autocompleteinput0, div1, null);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			mount_component(autocompleteinput1, div2, null);
    			append_dev(form, t9);
    			append_dev(form, div4);
    			if (if_block1) if_block1.m(div4, null);
    			append_dev(div4, t10);
    			append_dev(div4, input0);
    			append_dev(div4, t11);
    			append_dev(div4, input1);
    			/*dialog_1_binding*/ ctx[10](dialog_1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(input1, "click", /*click_handler_2*/ ctx[9], false, false, false),
    					listen_dev(form, "submit", /*submitWeapon*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*weapon*/ 1) && t4_value !== (t4_value = /*weapon*/ ctx[0].name + "")) set_data_dev(t4, t4_value);

    			if (!current || dirty & /*weapon*/ 1 && !src_url_equal(img.src, img_src_value = /*weapon*/ ctx[0].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*weapon*/ 1 && img_alt_value !== (img_alt_value = /*weapon*/ ctx[0].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (!current || dirty & /*weapon*/ 1 && img_title_value !== (img_title_value = /*weapon*/ ctx[0].name)) {
    				attr_dev(img, "title", img_title_value);
    			}

    			if (/*weapon*/ ctx[0].id == null) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div3, t7);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			const autocompleteinput0_changes = {};

    			if (!updating_value && dirty & /*weapon*/ 1) {
    				updating_value = true;
    				autocompleteinput0_changes.value = /*weapon*/ ctx[0].start;
    				add_flush_callback(() => updating_value = false);
    			}

    			autocompleteinput0.$set(autocompleteinput0_changes);
    			const autocompleteinput1_changes = {};
    			if (dirty & /*weapon*/ 1) autocompleteinput1_changes.items = filteredCombination(/*weapon*/ ctx[0].start);

    			if (!updating_value_1 && dirty & /*weapon*/ 1) {
    				updating_value_1 = true;
    				autocompleteinput1_changes.value = /*weapon*/ ctx[0].end;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			autocompleteinput1.$set(autocompleteinput1_changes);

    			if (/*weapon*/ ctx[0].id != null) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$6(ctx);
    					if_block1.c();
    					if_block1.m(div4, t10);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(autocompleteinput0.$$.fragment, local);
    			transition_in(autocompleteinput1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(autocompleteinput0.$$.fragment, local);
    			transition_out(autocompleteinput1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dialog_1);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			if (if_block0) if_block0.d();
    			destroy_component(autocompleteinput0);
    			destroy_component(autocompleteinput1);
    			if (if_block1) if_block1.d();
    			/*dialog_1_binding*/ ctx[10](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function generateLevelCombination() {
    	const options = [];

    	for (let level = 1; level <= 90; level++) {
    		const cap = genshin_data.levelBarriers.find(b => level <= b);
    		options.push(`${level}/${cap}`);

    		if (level < 10) ; else if (level === cap && level < 90) {
    			options.push(`${level}/${genshin_data.levelBarriers.find(b => level < b)}`); // options.push(`0${level}/${cap}`);
    		}
    	}

    	return options;
    }

    function filteredCombination(value) {
    	if (!level_options.includes(value)) return level_options;
    	const [start, end] = value.split("/").map(v => parseInt(v));

    	return level_options.filter(lo => {
    		const [low, high] = lo.split("/").map(v => parseInt(v));
    		return low >= start && high >= end;
    	});
    }

    const level_options = generateLevelCombination();
    const empty_weapon = { name: "", image: "", end: "", start: "" };

    function instance$9($$self, $$props, $$invalidate) {
    	let $build_list;
    	let $selected_build;
    	validate_store(build_list, 'build_list');
    	component_subscribe($$self, build_list, $$value => $$invalidate(11, $build_list = $$value));
    	validate_store(selected_build, 'selected_build');
    	component_subscribe($$self, selected_build, $$value => $$invalidate(12, $selected_build = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WeaponDialog', slots, []);
    	const dispatch = createEventDispatcher();
    	let weapon = empty_weapon;
    	let dialog;

    	function deleteWeapon() {
    		const index = $selected_build.weap_build.findIndex(w => w.id === weapon.id);

    		if (index >= 0) {
    			$selected_build.weap_build.splice(index, 1);
    			set_store_value(selected_build, $selected_build.weap_build = [...$selected_build.weap_build], $selected_build);
    			set_store_value(build_list, $build_list = [...$build_list], $build_list);
    		}

    		dialog.close();
    	}

    	function open(data) {
    		if (data != null) {
    			$$invalidate(0, weapon = deepClone(data));
    		} else {
    			const w = genshin_data.weapon.list[0];
    			$$invalidate(0, weapon = deepClone(empty_weapon));
    			$$invalidate(0, weapon.name = w.name, weapon);
    			$$invalidate(0, weapon.image = w.image, weapon);
    		}

    		dialog.showModal();
    	}

    	function submitWeapon() {
    		dispatch("create", weapon);
    		dialog.close();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WeaponDialog> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dialog.close();

    	const click_handler_1 = weap => {
    		$$invalidate(0, weapon.image = weap.image, weapon);
    		$$invalidate(0, weapon.name = weap.name, weapon);
    	};

    	function autocompleteinput0_value_binding(value) {
    		if ($$self.$$.not_equal(weapon.start, value)) {
    			weapon.start = value;
    			$$invalidate(0, weapon);
    		}
    	}

    	function autocompleteinput1_value_binding(value) {
    		if ($$self.$$.not_equal(weapon.end, value)) {
    			weapon.end = value;
    			$$invalidate(0, weapon);
    		}
    	}

    	const click_handler_2 = () => dialog.close();

    	function dialog_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			dialog = $$value;
    			$$invalidate(1, dialog);
    		});
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		genshin_data,
    		AutocompleteInput,
    		Icon,
    		generateLevelCombination,
    		filteredCombination,
    		level_options,
    		empty_weapon,
    		deepClone,
    		build_list,
    		selected_build,
    		dispatch,
    		weapon,
    		dialog,
    		deleteWeapon,
    		open,
    		submitWeapon,
    		$build_list,
    		$selected_build
    	});

    	$$self.$inject_state = $$props => {
    		if ('weapon' in $$props) $$invalidate(0, weapon = $$props.weapon);
    		if ('dialog' in $$props) $$invalidate(1, dialog = $$props.dialog);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		weapon,
    		dialog,
    		deleteWeapon,
    		submitWeapon,
    		open,
    		click_handler,
    		click_handler_1,
    		autocompleteinput0_value_binding,
    		autocompleteinput1_value_binding,
    		click_handler_2,
    		dialog_1_binding
    	];
    }

    class WeaponDialog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { open: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WeaponDialog",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get open() {
    		return this.$$.ctx[4];
    	}

    	set open(value) {
    		throw new Error("<WeaponDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\CharacterIcon.svelte generated by Svelte v3.55.1 */

    const { Object: Object_1$2 } = globals;
    const file$8 = "src\\components\\CharacterIcon.svelte";

    function create_fragment$8(ctx) {
    	let button1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t;
    	let button0;
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button1 = element("button");
    			img = element("img");
    			t = space();
    			button0 = element("button");
    			div = element("div");
    			if (!src_url_equal(img.src, img_src_value = /*conf*/ ctx[0].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*conf*/ ctx[0].name);
    			attr_dev(img, "class", "svelte-72ed8v");
    			add_location(img, file$8, 45, 4, 1386);
    			attr_dev(div, "class", "svelte-72ed8v");
    			add_location(div, file$8, 50, 8, 1578);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "select svelte-72ed8v");
    			add_location(button0, file$8, 46, 4, 1432);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "title", /*title*/ ctx[1]);
    			attr_dev(button1, "class", "svelte-72ed8v");
    			toggle_class(button1, "active", /*$highlight_manager*/ ctx[2].isSelected("character", /*conf*/ ctx[0].id));
    			add_location(button1, file$8, 40, 0, 1254);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button1, anchor);
    			append_dev(button1, img);
    			append_dev(button1, t);
    			append_dev(button1, button0);
    			append_dev(button0, div);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", stop_propagation(/*click_handler_1*/ ctx[4]), false, false, true),
    					listen_dev(button1, "click", /*click_handler*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*conf*/ 1 && !src_url_equal(img.src, img_src_value = /*conf*/ ctx[0].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*conf*/ 1 && img_alt_value !== (img_alt_value = /*conf*/ ctx[0].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*title*/ 2) {
    				attr_dev(button1, "title", /*title*/ ctx[1]);
    			}

    			if (dirty & /*$highlight_manager, conf*/ 5) {
    				toggle_class(button1, "active", /*$highlight_manager*/ ctx[2].isSelected("character", /*conf*/ ctx[0].id));
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function buildTalentLines(talent) {
    	function displayNumber(value) {
    		const [start, end] = value.split("/");
    		return start === end ? start : `${start} -> ${end}`;
    	}

    	return [
    		`   Basic: ${displayNumber(talent.basic_talent)}`,
    		`   Elemental: ${displayNumber(talent.elemental_talent)}`,
    		`   Burst: ${displayNumber(talent.burst_talent)}`
    	];
    }

    function formatLevel(start, end) {
    	return start === end ? start : `${start} -> ${end}`;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let title;
    	let $highlight_manager;
    	validate_store(highlight_manager, 'highlight_manager');
    	component_subscribe($$self, highlight_manager, $$value => $$invalidate(2, $highlight_manager = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CharacterIcon', slots, []);

    	function buildCharacterTooltip() {
    		const lines = [
    			`Name: ${conf.name}`,
    			`Level: ${formatLevel(conf.level_start, conf.level_end)}`,
    			""
    		];

    		if ("basic_talent" in conf.talent) {
    			lines.push("Talent:");
    			lines.push(...buildTalentLines(conf.talent));
    		} else {
    			for (let [el, tal] of Object.entries(conf.talent)) {
    				lines.push(`${el} Talent:`);
    				lines.push(...buildTalentLines(tal));
    				lines.push("");
    			}

    			lines.pop();
    		}

    		return lines.join("\n");
    	}

    	let { conf } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (conf === undefined && !('conf' in $$props || $$self.$$.bound[$$self.$$.props['conf']])) {
    			console.warn("<CharacterIcon> was created without expected prop 'conf'");
    		}
    	});

    	const writable_props = ['conf'];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CharacterIcon> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_1 = () => highlight.select("character", conf.id);

    	$$self.$$set = $$props => {
    		if ('conf' in $$props) $$invalidate(0, conf = $$props.conf);
    	};

    	$$self.$capture_state = () => ({
    		highlight,
    		highlight_manager,
    		buildTalentLines,
    		formatLevel,
    		buildCharacterTooltip,
    		conf,
    		title,
    		$highlight_manager
    	});

    	$$self.$inject_state = $$props => {
    		if ('conf' in $$props) $$invalidate(0, conf = $$props.conf);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(1, title = buildCharacterTooltip());
    	return [conf, title, $highlight_manager, click_handler, click_handler_1];
    }

    class CharacterIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { conf: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CharacterIcon",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get conf() {
    		throw new Error("<CharacterIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set conf(value) {
    		throw new Error("<CharacterIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\WeaponIcon.svelte generated by Svelte v3.55.1 */
    const file$7 = "src\\components\\WeaponIcon.svelte";

    function create_fragment$7(ctx) {
    	let button1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t;
    	let button0;
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button1 = element("button");
    			img = element("img");
    			t = space();
    			button0 = element("button");
    			div = element("div");
    			if (!src_url_equal(img.src, img_src_value = /*conf*/ ctx[0].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*conf*/ ctx[0].name);
    			attr_dev(img, "class", "svelte-72ed8v");
    			add_location(img, file$7, 15, 4, 427);
    			attr_dev(div, "class", "svelte-72ed8v");
    			add_location(div, file$7, 20, 8, 616);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "select svelte-72ed8v");
    			add_location(button0, file$7, 16, 4, 473);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "title", /*title*/ ctx[1]);
    			attr_dev(button1, "class", "svelte-72ed8v");
    			toggle_class(button1, "active", /*$highlight_manager*/ ctx[2].isSelected("weapon", /*conf*/ ctx[0].id));
    			add_location(button1, file$7, 10, 0, 298);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button1, anchor);
    			append_dev(button1, img);
    			append_dev(button1, t);
    			append_dev(button1, button0);
    			append_dev(button0, div);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", stop_propagation(/*click_handler_1*/ ctx[4]), false, false, true),
    					listen_dev(button1, "click", /*click_handler*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*conf*/ 1 && !src_url_equal(img.src, img_src_value = /*conf*/ ctx[0].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*conf*/ 1 && img_alt_value !== (img_alt_value = /*conf*/ ctx[0].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*title*/ 2) {
    				attr_dev(button1, "title", /*title*/ ctx[1]);
    			}

    			if (dirty & /*$highlight_manager, conf*/ 5) {
    				toggle_class(button1, "active", /*$highlight_manager*/ ctx[2].isSelected("weapon", /*conf*/ ctx[0].id));
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let title;
    	let $highlight_manager;
    	validate_store(highlight_manager, 'highlight_manager');
    	component_subscribe($$self, highlight_manager, $$value => $$invalidate(2, $highlight_manager = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WeaponIcon', slots, []);
    	let { conf } = $$props;

    	function formatLevel() {
    		return conf.start === conf.end
    		? conf.start
    		: `${conf.start} -> ${conf.end}`;
    	}

    	$$self.$$.on_mount.push(function () {
    		if (conf === undefined && !('conf' in $$props || $$self.$$.bound[$$self.$$.props['conf']])) {
    			console.warn("<WeaponIcon> was created without expected prop 'conf'");
    		}
    	});

    	const writable_props = ['conf'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WeaponIcon> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_1 = () => highlight.select("weapon", conf.id);

    	$$self.$$set = $$props => {
    		if ('conf' in $$props) $$invalidate(0, conf = $$props.conf);
    	};

    	$$self.$capture_state = () => ({
    		highlight,
    		highlight_manager,
    		conf,
    		formatLevel,
    		title,
    		$highlight_manager
    	});

    	$$self.$inject_state = $$props => {
    		if ('conf' in $$props) $$invalidate(0, conf = $$props.conf);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*conf*/ 1) {
    			$$invalidate(1, title = `Name: ${conf.name}\nLevel: ${formatLevel()}`);
    		}
    	};

    	return [conf, title, $highlight_manager, click_handler, click_handler_1];
    }

    class WeaponIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { conf: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WeaponIcon",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get conf() {
    		throw new Error("<WeaponIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set conf(value) {
    		throw new Error("<WeaponIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\BuildAccordion.svelte generated by Svelte v3.55.1 */

    const { Object: Object_1$1 } = globals;
    const file$6 = "src\\BuildAccordion.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    // (63:8) {#each $selected_build.char_build as character (character.id)}
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let charactericon;
    	let current;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[6](/*character*/ ctx[16]);
    	}

    	charactericon = new CharacterIcon({
    			props: { conf: /*character*/ ctx[16] },
    			$$inline: true
    		});

    	charactericon.$on("click", click_handler_1);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(charactericon.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(charactericon, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const charactericon_changes = {};
    			if (dirty & /*$selected_build*/ 4) charactericon_changes.conf = /*character*/ ctx[16];
    			charactericon.$set(charactericon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(charactericon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(charactericon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(charactericon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(63:8) {#each $selected_build.char_build as character (character.id)}",
    		ctx
    	});

    	return block;
    }

    // (81:8) {#each $selected_build.weap_build as weapon}
    function create_each_block$3(ctx) {
    	let weaponicon;
    	let current;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[8](/*weapon*/ ctx[13]);
    	}

    	weaponicon = new WeaponIcon({
    			props: { conf: /*weapon*/ ctx[13] },
    			$$inline: true
    		});

    	weaponicon.$on("click", click_handler_3);

    	const block = {
    		c: function create() {
    			create_component(weaponicon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(weaponicon, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const weaponicon_changes = {};
    			if (dirty & /*$selected_build*/ 4) weaponicon_changes.conf = /*weapon*/ ctx[13];
    			weaponicon.$set(weaponicon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(weaponicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(weaponicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(weaponicon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(81:8) {#each $selected_build.weap_build as weapon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let section;
    	let button0;
    	let t1;
    	let div0;
    	let button1;
    	let t3;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map();
    	let t4;
    	let button2;
    	let t6;
    	let div1;
    	let button3;
    	let t8;
    	let t9;
    	let characterdialog;
    	let t10;
    	let weapondialog;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*$selected_build*/ ctx[2].char_build;
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*character*/ ctx[16].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1(key, child_ctx));
    	}

    	let each_value = /*$selected_build*/ ctx[2].weap_build;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let characterdialog_props = {};

    	characterdialog = new CharacterDialog({
    			props: characterdialog_props,
    			$$inline: true
    		});

    	/*characterdialog_binding*/ ctx[9](characterdialog);
    	characterdialog.$on("create", /*submitCharacter*/ ctx[3]);
    	let weapondialog_props = {};

    	weapondialog = new WeaponDialog({
    			props: weapondialog_props,
    			$$inline: true
    		});

    	/*weapondialog_binding*/ ctx[10](weapondialog);
    	weapondialog.$on("create", /*submitWeapon*/ ctx[4]);

    	const block = {
    		c: function create() {
    			section = element("section");
    			button0 = element("button");
    			button0.textContent = "Characters";
    			t1 = space();
    			div0 = element("div");
    			button1 = element("button");
    			button1.textContent = "Add";
    			t3 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t4 = space();
    			button2 = element("button");
    			button2.textContent = "Weapons";
    			t6 = space();
    			div1 = element("div");
    			button3 = element("button");
    			button3.textContent = "Add";
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			create_component(characterdialog.$$.fragment);
    			t10 = space();
    			create_component(weapondialog.$$.fragment);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "header svelte-1sw21mz");
    			toggle_class(button0, "open", false);
    			add_location(button0, file$6, 48, 4, 2099);
    			attr_dev(button1, "class", "add svelte-1sw21mz");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$6, 57, 8, 2318);
    			attr_dev(div0, "class", "body icon-grid svelte-1sw21mz");
    			toggle_class(div0, "open", false);
    			add_location(div0, file$6, 56, 4, 2261);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "header svelte-1sw21mz");
    			toggle_class(button2, "open", false);
    			add_location(button2, file$6, 69, 4, 2685);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "add svelte-1sw21mz");
    			add_location(button3, file$6, 78, 8, 2901);
    			attr_dev(div1, "class", "body icon-grid svelte-1sw21mz");
    			toggle_class(div1, "open", false);
    			add_location(div1, file$6, 77, 4, 2844);
    			attr_dev(section, "class", "svelte-1sw21mz");
    			add_location(section, file$6, 47, 0, 2084);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, button0);
    			append_dev(section, t1);
    			append_dev(section, div0);
    			append_dev(div0, button1);
    			append_dev(div0, t3);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(section, t4);
    			append_dev(section, button2);
    			append_dev(section, t6);
    			append_dev(section, div1);
    			append_dev(div1, button3);
    			append_dev(div1, t8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			insert_dev(target, t9, anchor);
    			mount_component(characterdialog, target, anchor);
    			insert_dev(target, t10, anchor);
    			mount_component(weapondialog, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", toggleAccordion, false, false, false),
    					listen_dev(button1, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button2, "click", toggleAccordion, false, false, false),
    					listen_dev(button3, "click", /*click_handler_2*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$selected_build, character_modal*/ 5) {
    				each_value_1 = /*$selected_build*/ ctx[2].char_build;
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, div0, outro_and_destroy_block, create_each_block_1, null, get_each_context_1);
    				check_outros();
    			}

    			if (dirty & /*$selected_build, weapon_modal*/ 6) {
    				each_value = /*$selected_build*/ ctx[2].weap_build;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const characterdialog_changes = {};
    			characterdialog.$set(characterdialog_changes);
    			const weapondialog_changes = {};
    			weapondialog.$set(weapondialog_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(characterdialog.$$.fragment, local);
    			transition_in(weapondialog.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(characterdialog.$$.fragment, local);
    			transition_out(weapondialog.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t9);
    			/*characterdialog_binding*/ ctx[9](null);
    			destroy_component(characterdialog, detaching);
    			if (detaching) detach_dev(t10);
    			/*weapondialog_binding*/ ctx[10](null);
    			destroy_component(weapondialog, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function toggleAccordion(event) {
    	var _a;
    	const target = event.target;
    	target.classList.toggle("open");

    	(_a = target.nextElementSibling) === null || _a === void 0
    	? void 0
    	: _a.classList.toggle("open");
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $build_list;
    	let $selected_build;
    	let $build_index;
    	validate_store(build_list, 'build_list');
    	component_subscribe($$self, build_list, $$value => $$invalidate(11, $build_list = $$value));
    	validate_store(selected_build, 'selected_build');
    	component_subscribe($$self, selected_build, $$value => $$invalidate(2, $selected_build = $$value));
    	validate_store(build_index, 'build_index');
    	component_subscribe($$self, build_index, $$value => $$invalidate(12, $build_index = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BuildAccordion', slots, []);
    	let character_modal;
    	let weapon_modal;

    	function submitCharacter(event) {
    		const index = $selected_build.char_build.findIndex(cb => cb.id === event.detail.id);

    		if (index >= 0) {
    			// update
    			const arr = Array.from($selected_build.char_build);

    			arr[index] = event.detail;
    			set_store_value(build_list, $build_list[$build_index] = Object.assign(Object.assign({}, $selected_build), { char_build: arr }), $build_list);
    		} else {
    			const arr = $selected_build.char_build;
    			const id = arr.length >= 0 ? arr[arr.length - 1].id + 1 : 0;
    			arr.push(Object.assign(Object.assign({}, event.detail), { id }));
    			set_store_value(build_list, $build_list[$build_index] = Object.assign(Object.assign({}, $selected_build), { char_build: arr }), $build_list);
    		}

    		set_store_value(build_list, $build_list = [...$build_list], $build_list);
    	}

    	function submitWeapon(event) {
    		const index = $selected_build.weap_build.findIndex(cb => cb.id === event.detail.id);

    		if (index >= 0) {
    			// update
    			const arr = Array.from($selected_build.weap_build);

    			arr[index] = event.detail;
    			set_store_value(build_list, $build_list[$build_index] = Object.assign(Object.assign({}, $selected_build), { weap_build: arr }), $build_list);
    		} else {
    			const arr = $selected_build.weap_build;
    			const id = arr.length >= 0 ? arr[arr.length - 1].id + 1 : 0;
    			arr.push(Object.assign(Object.assign({}, event.detail), { id }));
    			set_store_value(build_list, $build_list[$build_index] = Object.assign(Object.assign({}, $selected_build), { weap_build: arr }), $build_list);
    		}

    		set_store_value(build_list, $build_list = [...$build_list], $build_list);
    	}

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BuildAccordion> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => character_modal.open();
    	const click_handler_1 = character => character_modal.open(character);
    	const click_handler_2 = () => weapon_modal.open();
    	const click_handler_3 = weapon => weapon_modal.open(weapon);

    	function characterdialog_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			character_modal = $$value;
    			$$invalidate(0, character_modal);
    		});
    	}

    	function weapondialog_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			weapon_modal = $$value;
    			$$invalidate(1, weapon_modal);
    		});
    	}

    	$$self.$capture_state = () => ({
    		CharacterDialog,
    		WeaponDialog,
    		CharacterIcon,
    		WeaponIcon,
    		build_list,
    		build_index,
    		selected_build,
    		character_modal,
    		weapon_modal,
    		toggleAccordion,
    		submitCharacter,
    		submitWeapon,
    		$build_list,
    		$selected_build,
    		$build_index
    	});

    	$$self.$inject_state = $$props => {
    		if ('character_modal' in $$props) $$invalidate(0, character_modal = $$props.character_modal);
    		if ('weapon_modal' in $$props) $$invalidate(1, weapon_modal = $$props.weapon_modal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		character_modal,
    		weapon_modal,
    		$selected_build,
    		submitCharacter,
    		submitWeapon,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		characterdialog_binding,
    		weapondialog_binding
    	];
    }

    class BuildAccordion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BuildAccordion",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    function clickOutsideDialog(node) {
        function closeIfClickOutside(event) {
            if (!isClickInside(node.getBoundingClientRect(), event)) {
                node.dispatchEvent(new CustomEvent("outsideclick"));
            }
        }
        node.addEventListener("click", closeIfClickOutside, true);
        return {
            destroy() {
                node.removeEventListener("click", closeIfClickOutside, true);
            },
        };
    }

    /* src\CreateBuildDialog.svelte generated by Svelte v3.55.1 */
    const file$5 = "src\\CreateBuildDialog.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (74:16) {#each genshin_data.character.list as character}
    function create_each_block$2(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let t;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[11](/*character*/ ctx[17]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			t = space();
    			if (!src_url_equal(img.src, img_src_value = /*character*/ ctx[17].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*character*/ ctx[17].name);
    			add_location(img, file$5, 84, 24, 2796);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-character", /*character*/ ctx[17].name);
    			attr_dev(button, "title", /*character*/ ctx[17].name);
    			button.disabled = button_disabled_value = /*character*/ ctx[17].name === /*thumbnail_name*/ ctx[6];
    			attr_dev(button, "class", "svelte-1ne184v");
    			toggle_class(button, "active", /*character*/ ctx[17].name === /*thumbnail_name*/ ctx[6]);
    			add_location(button, file$5, 74, 20, 2283);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*thumbnail_name*/ 64 && button_disabled_value !== (button_disabled_value = /*character*/ ctx[17].name === /*thumbnail_name*/ ctx[6])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty & /*genshin_data, thumbnail_name*/ 64) {
    				toggle_class(button, "active", /*character*/ ctx[17].name === /*thumbnail_name*/ ctx[6]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(74:16) {#each genshin_data.character.list as character}",
    		ctx
    	});

    	return block;
    }

    // (101:12) {#if edit}
    function create_if_block$5(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "button");
    			input.value = "Delete";
    			attr_dev(input, "class", "svelte-1ne184v");
    			add_location(input, file$5, 101, 16, 3308);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", /*deleteBuild*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(101:12) {#if edit}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let dialog_1;
    	let form;
    	let div0;
    	let icon0;
    	let t0;
    	let p;
    	let t2;
    	let button;
    	let icon1;
    	let t3;
    	let div2;
    	let img;
    	let img_src_value;
    	let t4;
    	let div1;
    	let t5;
    	let input0;
    	let t6;
    	let div3;
    	let t7;
    	let input1;
    	let t8;
    	let input2;
    	let current;
    	let mounted;
    	let dispose;

    	icon0 = new Icon({
    			props: { icon: "user-plus", size: "2rem" },
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: { icon: "cross", size: "2rem" },
    			$$inline: true
    		});

    	let each_value = genshin_data.character.list;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	let if_block = /*edit*/ ctx[0] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			dialog_1 = element("dialog");
    			form = element("form");
    			div0 = element("div");
    			create_component(icon0.$$.fragment);
    			t0 = space();
    			p = element("p");
    			p.textContent = "Build Creation";
    			t2 = space();
    			button = element("button");
    			create_component(icon1.$$.fragment);
    			t3 = space();
    			div2 = element("div");
    			img = element("img");
    			t4 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			div3 = element("div");
    			if (if_block) if_block.c();
    			t7 = space();
    			input1 = element("input");
    			t8 = space();
    			input2 = element("input");
    			attr_dev(p, "class", "svelte-1ne184v");
    			add_location(p, file$5, 59, 12, 1740);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "icon svelte-1ne184v");
    			attr_dev(button, "tabindex", "-1");
    			add_location(button, file$5, 60, 12, 1775);
    			attr_dev(div0, "class", "header svelte-1ne184v");
    			add_location(div0, file$5, 57, 8, 1655);
    			attr_dev(img, "class", "thumbnail svelte-1ne184v");
    			if (!src_url_equal(img.src, img_src_value = /*thumbnail*/ ctx[5])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*thumbnail_name*/ ctx[6]);
    			attr_dev(img, "title", /*thumbnail_name*/ ctx[6]);
    			add_location(img, file$5, 66, 12, 1975);
    			attr_dev(div1, "class", "horizontal-list svelte-1ne184v");
    			add_location(div1, file$5, 72, 12, 2144);
    			input0.autofocus = true;
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "description");
    			attr_dev(input0, "title", "Build description");
    			attr_dev(input0, "placeholder", "Description");
    			attr_dev(input0, "class", "svelte-1ne184v");
    			add_location(input0, file$5, 90, 12, 2989);
    			attr_dev(div2, "class", "body svelte-1ne184v");
    			add_location(div2, file$5, 65, 8, 1943);
    			attr_dev(input1, "type", "submit");
    			input1.value = "Submit";
    			attr_dev(input1, "class", "svelte-1ne184v");
    			add_location(input1, file$5, 103, 12, 3402);
    			attr_dev(input2, "type", "button");
    			input2.value = "Cancel";
    			attr_dev(input2, "class", "svelte-1ne184v");
    			add_location(input2, file$5, 104, 12, 3454);
    			attr_dev(div3, "class", "footer svelte-1ne184v");
    			add_location(div3, file$5, 99, 8, 3246);
    			attr_dev(form, "method", "dialog");
    			attr_dev(form, "class", "svelte-1ne184v");
    			add_location(form, file$5, 56, 4, 1604);
    			attr_dev(dialog_1, "class", "svelte-1ne184v");
    			add_location(dialog_1, file$5, 51, 0, 1467);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dialog_1, anchor);
    			append_dev(dialog_1, form);
    			append_dev(form, div0);
    			mount_component(icon0, div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(div0, t2);
    			append_dev(div0, button);
    			mount_component(icon1, button, null);
    			append_dev(form, t3);
    			append_dev(form, div2);
    			append_dev(div2, img);
    			append_dev(div2, t4);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			/*div1_binding*/ ctx[12](div1);
    			append_dev(div2, t5);
    			append_dev(div2, input0);
    			set_input_value(input0, /*description*/ ctx[4]);
    			append_dev(form, t6);
    			append_dev(form, div3);
    			if (if_block) if_block.m(div3, null);
    			append_dev(div3, t7);
    			append_dev(div3, input1);
    			append_dev(div3, t8);
    			append_dev(div3, input2);
    			/*dialog_1_binding*/ ctx[14](dialog_1);
    			current = true;
    			input0.focus();

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*close*/ ctx[1], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[13]),
    					listen_dev(input2, "click", /*close*/ ctx[1], false, false, false),
    					listen_dev(form, "submit", /*submit*/ ctx[8], false, false, false),
    					action_destroyer(clickOutsideDialog.call(null, dialog_1)),
    					listen_dev(dialog_1, "outsideclick", /*close*/ ctx[1], false, false, false),
    					listen_dev(dialog_1, "cancel", /*cancel_handler*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*thumbnail*/ 32 && !src_url_equal(img.src, img_src_value = /*thumbnail*/ ctx[5])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*thumbnail_name*/ 64) {
    				attr_dev(img, "alt", /*thumbnail_name*/ ctx[6]);
    			}

    			if (!current || dirty & /*thumbnail_name*/ 64) {
    				attr_dev(img, "title", /*thumbnail_name*/ ctx[6]);
    			}

    			if (dirty & /*genshin_data, thumbnail_name, thumbnail*/ 96) {
    				each_value = genshin_data.character.list;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*description*/ 16 && input0.value !== /*description*/ ctx[4]) {
    				set_input_value(input0, /*description*/ ctx[4]);
    			}

    			if (/*edit*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(div3, t7);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dialog_1);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			destroy_each(each_blocks, detaching);
    			/*div1_binding*/ ctx[12](null);
    			if (if_block) if_block.d();
    			/*dialog_1_binding*/ ctx[14](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CreateBuildDialog', slots, []);
    	let { edit = false } = $$props;
    	const dispatch = createEventDispatcher();
    	let dialog;
    	let char_list;
    	let description = "";
    	let thumbnail = genshin_data.character.list[0].image;
    	let thumbnail_name = genshin_data.character.list[0].name;

    	function open(data) {
    		data !== null && data !== void 0
    		? data
    		: data = {
    				description: "",
    				thumbnail: genshin_data.character.list[0].image,
    				thumbnail_name: genshin_data.character.list[0].name
    			};

    		$$invalidate(4, description = data.description);
    		$$invalidate(5, thumbnail = data.thumbnail);
    		$$invalidate(6, thumbnail_name = data.thumbnail_name);
    		dialog.showModal();
    		scrollToCharacter(thumbnail_name);
    	}

    	function close() {
    		dispatch("cancel");
    		dialog.close();
    	}

    	function submit() {
    		dispatch("create", { description, thumbnail, thumbnail_name });
    		dialog.close();
    	}

    	function deleteBuild() {
    		dispatch("delete");
    		dialog.close();
    	}

    	function scrollToCharacter(name) {
    		for (let el of char_list.children) {
    			if (el.dataset.character === name) {
    				el.scrollIntoView({ inline: "center", block: "center" });
    			}
    		}
    	}

    	const writable_props = ['edit'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CreateBuildDialog> was created with unknown prop '${key}'`);
    	});

    	const click_handler = character => {
    		$$invalidate(5, thumbnail = character.image);
    		$$invalidate(6, thumbnail_name = character.name);
    	};

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			char_list = $$value;
    			$$invalidate(3, char_list);
    		});
    	}

    	function input0_input_handler() {
    		description = this.value;
    		$$invalidate(4, description);
    	}

    	function dialog_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			dialog = $$value;
    			$$invalidate(2, dialog);
    		});
    	}

    	const cancel_handler = () => dispatch("cancel");

    	$$self.$$set = $$props => {
    		if ('edit' in $$props) $$invalidate(0, edit = $$props.edit);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		clickOutsideDialog,
    		Icon,
    		genshin_data,
    		edit,
    		dispatch,
    		dialog,
    		char_list,
    		description,
    		thumbnail,
    		thumbnail_name,
    		open,
    		close,
    		submit,
    		deleteBuild,
    		scrollToCharacter
    	});

    	$$self.$inject_state = $$props => {
    		if ('edit' in $$props) $$invalidate(0, edit = $$props.edit);
    		if ('dialog' in $$props) $$invalidate(2, dialog = $$props.dialog);
    		if ('char_list' in $$props) $$invalidate(3, char_list = $$props.char_list);
    		if ('description' in $$props) $$invalidate(4, description = $$props.description);
    		if ('thumbnail' in $$props) $$invalidate(5, thumbnail = $$props.thumbnail);
    		if ('thumbnail_name' in $$props) $$invalidate(6, thumbnail_name = $$props.thumbnail_name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		edit,
    		close,
    		dialog,
    		char_list,
    		description,
    		thumbnail,
    		thumbnail_name,
    		dispatch,
    		submit,
    		deleteBuild,
    		open,
    		click_handler,
    		div1_binding,
    		input0_input_handler,
    		dialog_1_binding,
    		cancel_handler
    	];
    }

    class CreateBuildDialog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { edit: 0, open: 10, close: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CreateBuildDialog",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get edit() {
    		throw new Error("<CreateBuildDialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edit(value) {
    		throw new Error("<CreateBuildDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get open() {
    		return this.$$.ctx[10];
    	}

    	set open(value) {
    		throw new Error("<CreateBuildDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx[1];
    	}

    	set close(value) {
    		throw new Error("<CreateBuildDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\BuildSelectDialog.svelte generated by Svelte v3.55.1 */

    const { Object: Object_1 } = globals;
    const file$4 = "src\\BuildSelectDialog.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (46:8) {#if $build_index != null}
    function create_if_block$4(ctx) {
    	let button;
    	let icon;
    	let t;
    	let current;
    	let mounted;
    	let dispose;

    	icon = new Icon({
    			props: { icon: "cross", size: "2rem" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			button = element("button");
    			create_component(icon.$$.fragment);
    			t = text("\r\n                Clear Selection");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "svelte-1jawnnt");
    			add_location(button, file$4, 46, 12, 1425);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			mount_component(icon, button, null);
    			append_dev(button, t);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			destroy_component(icon);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(46:8) {#if $build_index != null}",
    		ctx
    	});

    	return block;
    }

    // (58:12) {#each $build_list as build, i}
    function create_each_block$1(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let p;
    	let t1_value = /*build*/ ctx[14].description + "";
    	let t1;
    	let t2;
    	let small;
    	let t3;
    	let t4_value = /*build*/ ctx[14].char_build.length + "";
    	let t4;
    	let t5;
    	let t6_value = /*build*/ ctx[14].weap_build.length + "";
    	let t6;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[10](/*i*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			small = element("small");
    			t3 = text("Characters: ");
    			t4 = text(t4_value);
    			t5 = text(" Weapons: ");
    			t6 = text(t6_value);
    			if (!src_url_equal(img.src, img_src_value = /*build*/ ctx[14].thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*build*/ ctx[14].thumbnail_name);
    			attr_dev(img, "class", "svelte-1jawnnt");
    			add_location(img, file$4, 67, 20, 2171);
    			attr_dev(p, "class", "description svelte-1jawnnt");
    			add_location(p, file$4, 68, 20, 2249);
    			attr_dev(small, "class", "stats svelte-1jawnnt");
    			add_location(small, file$4, 69, 20, 2317);
    			attr_dev(button, "class", "build svelte-1jawnnt");
    			attr_dev(button, "type", "button");
    			button.disabled = button_disabled_value = /*i*/ ctx[16] === /*$build_index*/ ctx[4];
    			toggle_class(button, "active", /*i*/ ctx[16] === /*$build_index*/ ctx[4]);
    			add_location(button, file$4, 58, 16, 1818);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			append_dev(button, t0);
    			append_dev(button, p);
    			append_dev(p, t1);
    			append_dev(button, t2);
    			append_dev(button, small);
    			append_dev(small, t3);
    			append_dev(small, t4);
    			append_dev(small, t5);
    			append_dev(small, t6);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$build_list*/ 8 && !src_url_equal(img.src, img_src_value = /*build*/ ctx[14].thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$build_list*/ 8 && img_alt_value !== (img_alt_value = /*build*/ ctx[14].thumbnail_name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*$build_list*/ 8 && t1_value !== (t1_value = /*build*/ ctx[14].description + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$build_list*/ 8 && t4_value !== (t4_value = /*build*/ ctx[14].char_build.length + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*$build_list*/ 8 && t6_value !== (t6_value = /*build*/ ctx[14].weap_build.length + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$build_index*/ 16 && button_disabled_value !== (button_disabled_value = /*i*/ ctx[16] === /*$build_index*/ ctx[4])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty & /*$build_index*/ 16) {
    				toggle_class(button, "active", /*i*/ ctx[16] === /*$build_index*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(58:12) {#each $build_list as build, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let dialog_1;
    	let div3;
    	let div0;
    	let icon0;
    	let t0;
    	let p;
    	let t2;
    	let button0;
    	let icon1;
    	let t3;
    	let button1;
    	let icon2;
    	let t4;
    	let t5;
    	let t6;
    	let div2;
    	let t7;
    	let div1;
    	let t8;
    	let createbuilddialog;
    	let current;
    	let mounted;
    	let dispose;

    	icon0 = new Icon({
    			props: { icon: "menu-hamburger", size: "2rem" },
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: { icon: "cross", size: "2rem" },
    			$$inline: true
    		});

    	icon2 = new Icon({
    			props: { icon: "plus", size: "2rem" },
    			$$inline: true
    		});

    	let if_block = /*$build_index*/ ctx[4] != null && create_if_block$4(ctx);
    	let each_value = /*$build_list*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let createbuilddialog_props = {};

    	createbuilddialog = new CreateBuildDialog({
    			props: createbuilddialog_props,
    			$$inline: true
    		});

    	/*createbuilddialog_binding*/ ctx[12](createbuilddialog);
    	createbuilddialog.$on("create", /*submitNewBuild*/ ctx[5]);
    	createbuilddialog.$on("cancel", /*cancel_handler*/ ctx[13]);

    	const block = {
    		c: function create() {
    			dialog_1 = element("dialog");
    			div3 = element("div");
    			div0 = element("div");
    			create_component(icon0.$$.fragment);
    			t0 = space();
    			p = element("p");
    			p.textContent = "Build Selection";
    			t2 = space();
    			button0 = element("button");
    			create_component(icon1.$$.fragment);
    			t3 = space();
    			button1 = element("button");
    			create_component(icon2.$$.fragment);
    			t4 = text("\r\n            Create New");
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			div1 = element("div");
    			t8 = space();
    			create_component(createbuilddialog.$$.fragment);
    			attr_dev(p, "class", "svelte-1jawnnt");
    			add_location(p, file$4, 26, 12, 800);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "icon svelte-1jawnnt");
    			attr_dev(button0, "tabindex", "-1");
    			add_location(button0, file$4, 27, 12, 836);
    			attr_dev(div0, "class", "header svelte-1jawnnt");
    			add_location(div0, file$4, 24, 8, 710);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "svelte-1jawnnt");
    			toggle_class(button1, "span", /*$build_index*/ ctx[4] == null);
    			add_location(button1, file$4, 35, 8, 1085);
    			add_location(div1, file$4, 75, 12, 2558);
    			attr_dev(div2, "class", "build-panel svelte-1jawnnt");
    			add_location(div2, file$4, 56, 8, 1730);
    			attr_dev(div3, "class", "svelte-1jawnnt");
    			add_location(div3, file$4, 23, 4, 695);
    			attr_dev(dialog_1, "class", "svelte-1jawnnt");
    			add_location(dialog_1, file$4, 22, 0, 640);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dialog_1, anchor);
    			append_dev(dialog_1, div3);
    			append_dev(div3, div0);
    			mount_component(icon0, div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(div0, t2);
    			append_dev(div0, button0);
    			mount_component(icon1, button0, null);
    			append_dev(div3, t3);
    			append_dev(div3, button1);
    			mount_component(icon2, button1, null);
    			append_dev(button1, t4);
    			append_dev(div3, t5);
    			if (if_block) if_block.m(div3, null);
    			append_dev(div3, t6);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			/*dialog_1_binding*/ ctx[11](dialog_1);
    			insert_dev(target, t8, anchor);
    			mount_component(createbuilddialog, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[8], false, false, false),
    					listen_dev(dialog_1, "click", self(/*close*/ ctx[0]), false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$build_index*/ 16) {
    				toggle_class(button1, "span", /*$build_index*/ ctx[4] == null);
    			}

    			if (/*$build_index*/ ctx[4] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$build_index*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, t6);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*$build_index, dialog, $build_list*/ 26) {
    				each_value = /*$build_list*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, t7);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const createbuilddialog_changes = {};
    			createbuilddialog.$set(createbuilddialog_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(icon2.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(createbuilddialog.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(icon2.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(createbuilddialog.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dialog_1);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			destroy_component(icon2);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			/*dialog_1_binding*/ ctx[11](null);
    			if (detaching) detach_dev(t8);
    			/*createbuilddialog_binding*/ ctx[12](null);
    			destroy_component(createbuilddialog, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $build_list;
    	let $build_index;
    	validate_store(build_list, 'build_list');
    	component_subscribe($$self, build_list, $$value => $$invalidate(3, $build_list = $$value));
    	validate_store(build_index, 'build_index');
    	component_subscribe($$self, build_index, $$value => $$invalidate(4, $build_index = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BuildSelectDialog', slots, []);
    	let dialog;
    	let create_dialog;

    	function open() {
    		dialog.showModal();
    	}

    	function close() {
    		dialog.close();
    	}

    	function submitNewBuild(event) {
    		set_store_value(
    			build_list,
    			$build_list = [
    				...$build_list,
    				Object.assign(Object.assign({}, event.detail), { char_build: [], weap_build: [] })
    			],
    			$build_list
    		);

    		set_store_value(build_index, $build_index = $build_list.length - 1, $build_index);
    		dialog.close();
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BuildSelectDialog> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dialog.close();

    	const click_handler_1 = () => {
    		dialog.close();
    		create_dialog.open();
    	};

    	const click_handler_2 = () => {
    		set_store_value(build_index, $build_index = null, $build_index);
    		dialog.close();
    	};

    	const click_handler_3 = i => {
    		set_store_value(build_index, $build_index = i, $build_index);
    		dialog.close();
    	};

    	function dialog_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			dialog = $$value;
    			$$invalidate(1, dialog);
    		});
    	}

    	function createbuilddialog_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			create_dialog = $$value;
    			$$invalidate(2, create_dialog);
    		});
    	}

    	const cancel_handler = () => dialog.showModal();

    	$$self.$capture_state = () => ({
    		Icon,
    		CreateBuildDialog,
    		build_index,
    		build_list,
    		dialog,
    		create_dialog,
    		open,
    		close,
    		submitNewBuild,
    		$build_list,
    		$build_index
    	});

    	$$self.$inject_state = $$props => {
    		if ('dialog' in $$props) $$invalidate(1, dialog = $$props.dialog);
    		if ('create_dialog' in $$props) $$invalidate(2, create_dialog = $$props.create_dialog);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		close,
    		dialog,
    		create_dialog,
    		$build_list,
    		$build_index,
    		submitNewBuild,
    		open,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		dialog_1_binding,
    		createbuilddialog_binding,
    		cancel_handler
    	];
    }

    class BuildSelectDialog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { open: 6, close: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BuildSelectDialog",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get open() {
    		return this.$$.ctx[6];
    	}

    	set open(value) {
    		throw new Error("<BuildSelectDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx[0];
    	}

    	set close(value) {
    		throw new Error("<BuildSelectDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\BuildNavbar.svelte generated by Svelte v3.55.1 */
    const file$3 = "src\\BuildNavbar.svelte";

    // (32:8) {:else}
    function create_else_block_1(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: { icon: "user-question" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(32:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:8) {#if $selected_build != null}
    function create_if_block_1(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_title_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*$selected_build*/ ctx[2].thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*$selected_build*/ ctx[2].thumbnail_name);
    			attr_dev(img, "title", img_title_value = /*$selected_build*/ ctx[2].thumbnail_name);
    			attr_dev(img, "class", "svelte-wbebz9");
    			add_location(img, file$3, 27, 12, 993);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$selected_build*/ 4 && !src_url_equal(img.src, img_src_value = /*$selected_build*/ ctx[2].thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$selected_build*/ 4 && img_alt_value !== (img_alt_value = /*$selected_build*/ ctx[2].thumbnail_name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*$selected_build*/ 4 && img_title_value !== (img_title_value = /*$selected_build*/ ctx[2].thumbnail_name)) {
    				attr_dev(img, "title", img_title_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(27:8) {#if $selected_build != null}",
    		ctx
    	});

    	return block;
    }

    // (50:4) {:else}
    function create_else_block(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Access menu to select or create build";
    			attr_dev(h1, "class", "description svelte-wbebz9");
    			add_location(h1, file$3, 50, 8, 1763);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(50:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (37:4) {#if $selected_build != null}
    function create_if_block$3(ctx) {
    	let h1;
    	let t0_value = /*$selected_build*/ ctx[2].description + "";
    	let t0;
    	let t1;
    	let button;
    	let icon;
    	let current;
    	let mounted;
    	let dispose;

    	icon = new Icon({
    			props: { icon: "edit-4", size: "30px" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			create_component(icon.$$.fragment);
    			attr_dev(h1, "class", "description svelte-wbebz9");
    			add_location(h1, file$3, 37, 8, 1293);
    			attr_dev(button, "class", "icon");
    			add_location(button, file$3, 39, 8, 1363);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			mount_component(icon, button, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$selected_build*/ 4) && t0_value !== (t0_value = /*$selected_build*/ ctx[2].description + "")) set_data_dev(t0, t0_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			destroy_component(icon);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(37:4) {#if $selected_build != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let nav;
    	let button;
    	let icon;
    	let t0;
    	let div;
    	let current_block_type_index;
    	let if_block0;
    	let t1;
    	let current_block_type_index_1;
    	let if_block1;
    	let t2;
    	let buildselectdialog;
    	let t3;
    	let createbuilddialog;
    	let current;
    	let mounted;
    	let dispose;

    	icon = new Icon({
    			props: {
    				icon: "menu-hamburger",
    				size: "30px",
    				stroke: "inherit"
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block_1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$selected_build*/ ctx[2] != null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block$3, create_else_block];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*$selected_build*/ ctx[2] != null) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	let buildselectdialog_props = {};

    	buildselectdialog = new BuildSelectDialog({
    			props: buildselectdialog_props,
    			$$inline: true
    		});

    	/*buildselectdialog_binding*/ ctx[7](buildselectdialog);
    	let createbuilddialog_props = { edit: true };

    	createbuilddialog = new CreateBuildDialog({
    			props: createbuilddialog_props,
    			$$inline: true
    		});

    	/*createbuilddialog_binding*/ ctx[8](createbuilddialog);
    	createbuilddialog.$on("create", /*submitEdit*/ ctx[3]);
    	createbuilddialog.$on("delete", /*deleteActiveBuild*/ ctx[4]);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			button = element("button");
    			create_component(icon.$$.fragment);
    			t0 = space();
    			div = element("div");
    			if_block0.c();
    			t1 = space();
    			if_block1.c();
    			t2 = space();
    			create_component(buildselectdialog.$$.fragment);
    			t3 = space();
    			create_component(createbuilddialog.$$.fragment);
    			attr_dev(button, "class", "icon");
    			add_location(button, file$3, 21, 4, 758);
    			attr_dev(div, "class", "build-thumbnail svelte-wbebz9");
    			add_location(div, file$3, 25, 4, 911);
    			attr_dev(nav, "class", "svelte-wbebz9");
    			add_location(nav, file$3, 20, 0, 747);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, button);
    			mount_component(icon, button, null);
    			append_dev(nav, t0);
    			append_dev(nav, div);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(nav, t1);
    			if_blocks_1[current_block_type_index_1].m(nav, null);
    			insert_dev(target, t2, anchor);
    			mount_component(buildselectdialog, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(createbuilddialog, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div, null);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    					if_blocks_1[previous_block_index_1] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks_1[current_block_type_index_1];

    				if (!if_block1) {
    					if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(nav, null);
    			}

    			const buildselectdialog_changes = {};
    			buildselectdialog.$set(buildselectdialog_changes);
    			const createbuilddialog_changes = {};
    			createbuilddialog.$set(createbuilddialog_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(buildselectdialog.$$.fragment, local);
    			transition_in(createbuilddialog.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(buildselectdialog.$$.fragment, local);
    			transition_out(createbuilddialog.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(icon);
    			if_blocks[current_block_type_index].d();
    			if_blocks_1[current_block_type_index_1].d();
    			if (detaching) detach_dev(t2);
    			/*buildselectdialog_binding*/ ctx[7](null);
    			destroy_component(buildselectdialog, detaching);
    			if (detaching) detach_dev(t3);
    			/*createbuilddialog_binding*/ ctx[8](null);
    			destroy_component(createbuilddialog, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $build_index;
    	let $build_list;
    	let $selected_build;
    	validate_store(build_index, 'build_index');
    	component_subscribe($$self, build_index, $$value => $$invalidate(9, $build_index = $$value));
    	validate_store(build_list, 'build_list');
    	component_subscribe($$self, build_list, $$value => $$invalidate(10, $build_list = $$value));
    	validate_store(selected_build, 'selected_build');
    	component_subscribe($$self, selected_build, $$value => $$invalidate(2, $selected_build = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BuildNavbar', slots, []);
    	let selection_modal;
    	let edit_modal;

    	function submitEdit(data) {
    		const build = $build_list[$build_index];
    		build.description = data.detail.description;
    		build.thumbnail = data.detail.thumbnail;
    		build.thumbnail_name = data.detail.thumbnail_name;
    		set_store_value(build_list, $build_list[$build_index] = build, $build_list);
    		set_store_value(build_list, $build_list = [...$build_list], $build_list);
    	}

    	function deleteActiveBuild() {
    		set_store_value(build_list, $build_list = $build_list.filter((_, i) => i != $build_index), $build_list);
    		set_store_value(build_index, $build_index = null, $build_index);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BuildNavbar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => selection_modal.open();

    	const click_handler_1 = () => edit_modal.open({
    		description: $selected_build.description,
    		thumbnail: $selected_build.thumbnail,
    		thumbnail_name: $selected_build.thumbnail_name
    	});

    	function buildselectdialog_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			selection_modal = $$value;
    			$$invalidate(0, selection_modal);
    		});
    	}

    	function createbuilddialog_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			edit_modal = $$value;
    			$$invalidate(1, edit_modal);
    		});
    	}

    	$$self.$capture_state = () => ({
    		BuildSelectDialog,
    		Icon,
    		CreateBuildDialog,
    		build_list,
    		build_index,
    		selected_build,
    		selection_modal,
    		edit_modal,
    		submitEdit,
    		deleteActiveBuild,
    		$build_index,
    		$build_list,
    		$selected_build
    	});

    	$$self.$inject_state = $$props => {
    		if ('selection_modal' in $$props) $$invalidate(0, selection_modal = $$props.selection_modal);
    		if ('edit_modal' in $$props) $$invalidate(1, edit_modal = $$props.edit_modal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selection_modal,
    		edit_modal,
    		$selected_build,
    		submitEdit,
    		deleteActiveBuild,
    		click_handler,
    		click_handler_1,
    		buildselectdialog_binding,
    		createbuilddialog_binding
    	];
    }

    class BuildNavbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BuildNavbar",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\MaterialCostList.svelte generated by Svelte v3.55.1 */
    const file$2 = "src\\components\\MaterialCostList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (6:0) {#if list.length > 0}
    function create_if_block$2(ctx) {
    	let div;
    	let h1;
    	let t0;
    	let t1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*list*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*ti*/ ctx[4].item_id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "svelte-1yve173");
    			add_location(h1, file$2, 7, 8, 187);
    			attr_dev(div, "class", "icon-grid svelte-1yve173");
    			add_location(div, file$2, 6, 4, 154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);

    			if (dirty & /*$highlight_manager, list, highlight*/ 5) {
    				each_value = /*list*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(6:0) {#if list.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (9:8) {#each list as ti (ti.item_id)}
    function create_each_block(key_1, ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_title_value;
    	let t0;
    	let span;
    	let t1_value = /*ti*/ ctx[4].quantity + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*ti*/ ctx[4]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*ti*/ ctx[4].item.image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*ti*/ ctx[4].item.name);
    			attr_dev(img, "title", img_title_value = /*ti*/ ctx[4].item.name);
    			attr_dev(img, "class", "svelte-1yve173");
    			add_location(img, file$2, 16, 16, 528);
    			add_location(span, file$2, 20, 16, 676);
    			attr_dev(button, "class", "icon svelte-1yve173");
    			toggle_class(button, "active", /*$highlight_manager*/ ctx[2].isSelected("item", /*ti*/ ctx[4].item_id));
    			add_location(button, file$2, 9, 12, 258);
    			this.first = button;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			append_dev(button, t0);
    			append_dev(button, span);
    			append_dev(span, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*list*/ 1 && !src_url_equal(img.src, img_src_value = /*ti*/ ctx[4].item.image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*list*/ 1 && img_alt_value !== (img_alt_value = /*ti*/ ctx[4].item.name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*list*/ 1 && img_title_value !== (img_title_value = /*ti*/ ctx[4].item.name)) {
    				attr_dev(img, "title", img_title_value);
    			}

    			if (dirty & /*list*/ 1 && t1_value !== (t1_value = /*ti*/ ctx[4].quantity + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$highlight_manager, list*/ 5) {
    				toggle_class(button, "active", /*$highlight_manager*/ ctx[2].isSelected("item", /*ti*/ ctx[4].item_id));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(9:8) {#each list as ti (ti.item_id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*list*/ ctx[0].length > 0 && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*list*/ ctx[0].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $highlight_manager;
    	validate_store(highlight_manager, 'highlight_manager');
    	component_subscribe($$self, highlight_manager, $$value => $$invalidate(2, $highlight_manager = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MaterialCostList', slots, []);
    	let { list } = $$props;
    	let { title } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (list === undefined && !('list' in $$props || $$self.$$.bound[$$self.$$.props['list']])) {
    			console.warn("<MaterialCostList> was created without expected prop 'list'");
    		}

    		if (title === undefined && !('title' in $$props || $$self.$$.bound[$$self.$$.props['title']])) {
    			console.warn("<MaterialCostList> was created without expected prop 'title'");
    		}
    	});

    	const writable_props = ['list', 'title'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MaterialCostList> was created with unknown prop '${key}'`);
    	});

    	const click_handler = ti => highlight.select("item", ti.item_id);

    	$$self.$$set = $$props => {
    		if ('list' in $$props) $$invalidate(0, list = $$props.list);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({
    		highlight,
    		highlight_manager,
    		list,
    		title,
    		$highlight_manager
    	});

    	$$self.$inject_state = $$props => {
    		if ('list' in $$props) $$invalidate(0, list = $$props.list);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [list, title, $highlight_manager, click_handler];
    }

    class MaterialCostList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { list: 0, title: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MaterialCostList",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get list() {
    		throw new Error("<MaterialCostList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set list(value) {
    		throw new Error("<MaterialCostList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<MaterialCostList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<MaterialCostList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\CostsPanel.svelte generated by Svelte v3.55.1 */
    const file$1 = "src\\CostsPanel.svelte";

    // (36:8) {#if $cost.crown.quantity > 0}
    function create_if_block$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let p;
    	let t1_value = /*$cost*/ ctx[0].crown.quantity + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			if (!src_url_equal(img.src, img_src_value = crown.image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", crown.name);
    			attr_dev(img, "title", crown.name);
    			attr_dev(img, "class", "svelte-f5vf8d");
    			add_location(img, file$1, 37, 16, 1373);
    			add_location(p, file$1, 38, 16, 1452);
    			attr_dev(div, "class", "svelte-f5vf8d");
    			add_location(div, file$1, 36, 12, 1350);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$cost*/ 1 && t1_value !== (t1_value = /*$cost*/ ctx[0].crown.quantity + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(36:8) {#if $cost.crown.quantity > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let section;
    	let div3;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let p0;
    	let t1_value = format(/*$cost*/ ctx[0].mora.quantity) + "";
    	let t1;
    	let t2;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let p1;
    	let t4_value = format(Math.ceil(/*$cost*/ ctx[0].character_exp.quantity / 20000)) + "";
    	let t4;
    	let t5;
    	let div2;
    	let img2;
    	let img2_src_value;
    	let t6;
    	let p2;
    	let t7_value = format(Math.ceil(/*$cost*/ ctx[0].weapon_exp.quantity / 10000)) + "";
    	let t7;
    	let t8;
    	let t9;
    	let materialcostlist0;
    	let t10;
    	let materialcostlist1;
    	let t11;
    	let materialcostlist2;
    	let t12;
    	let materialcostlist3;
    	let t13;
    	let materialcostlist4;
    	let t14;
    	let materialcostlist5;
    	let t15;
    	let materialcostlist6;
    	let t16;
    	let materialcostlist7;
    	let current;
    	let if_block = /*$cost*/ ctx[0].crown.quantity > 0 && create_if_block$1(ctx);

    	materialcostlist0 = new MaterialCostList({
    			props: {
    				list: /*$cost*/ ctx[0].local_specialty.list,
    				title: "Local Specialty"
    			},
    			$$inline: true
    		});

    	materialcostlist1 = new MaterialCostList({
    			props: {
    				list: /*$cost*/ ctx[0].gem.list,
    				title: "Gems"
    			},
    			$$inline: true
    		});

    	materialcostlist2 = new MaterialCostList({
    			props: {
    				list: /*$cost*/ ctx[0].ascension_boss.list,
    				title: "Ascension Bosses"
    			},
    			$$inline: true
    		});

    	materialcostlist3 = new MaterialCostList({
    			props: {
    				list: /*$cost*/ ctx[0].common.list,
    				title: "Common Loot"
    			},
    			$$inline: true
    		});

    	materialcostlist4 = new MaterialCostList({
    			props: {
    				list: /*$cost*/ ctx[0].book.list,
    				title: "Talent Books"
    			},
    			$$inline: true
    		});

    	materialcostlist5 = new MaterialCostList({
    			props: {
    				list: /*$cost*/ ctx[0].talent_boss.list,
    				title: "Talent Bosses"
    			},
    			$$inline: true
    		});

    	materialcostlist6 = new MaterialCostList({
    			props: {
    				list: /*$cost*/ ctx[0].elite.list,
    				title: "Elite Loot"
    			},
    			$$inline: true
    		});

    	materialcostlist7 = new MaterialCostList({
    			props: {
    				list: /*$cost*/ ctx[0].wam.list,
    				title: "Weapon Ascension Material"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			img1 = element("img");
    			t3 = space();
    			p1 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			div2 = element("div");
    			img2 = element("img");
    			t6 = space();
    			p2 = element("p");
    			t7 = text(t7_value);
    			t8 = space();
    			if (if_block) if_block.c();
    			t9 = space();
    			create_component(materialcostlist0.$$.fragment);
    			t10 = space();
    			create_component(materialcostlist1.$$.fragment);
    			t11 = space();
    			create_component(materialcostlist2.$$.fragment);
    			t12 = space();
    			create_component(materialcostlist3.$$.fragment);
    			t13 = space();
    			create_component(materialcostlist4.$$.fragment);
    			t14 = space();
    			create_component(materialcostlist5.$$.fragment);
    			t15 = space();
    			create_component(materialcostlist6.$$.fragment);
    			t16 = space();
    			create_component(materialcostlist7.$$.fragment);
    			if (!src_url_equal(img0.src, img0_src_value = mora.image)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", mora.name);
    			attr_dev(img0, "title", mora.name);
    			attr_dev(img0, "class", "svelte-f5vf8d");
    			add_location(img0, file$1, 18, 12, 681);
    			add_location(p0, file$1, 19, 12, 753);
    			attr_dev(div0, "class", "svelte-f5vf8d");
    			add_location(div0, file$1, 17, 8, 662);
    			if (!src_url_equal(img1.src, img1_src_value = hero_wit.image)) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", hero_wit.name);
    			attr_dev(img1, "title", hero_wit.name);
    			attr_dev(img1, "class", "svelte-f5vf8d");
    			add_location(img1, file$1, 22, 12, 834);
    			add_location(p1, file$1, 26, 12, 969);
    			attr_dev(div1, "class", "svelte-f5vf8d");
    			add_location(div1, file$1, 21, 8, 815);
    			if (!src_url_equal(img2.src, img2_src_value = mystic_ore.image)) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", mystic_ore.name);
    			attr_dev(img2, "title", mystic_ore.name);
    			attr_dev(img2, "class", "svelte-f5vf8d");
    			add_location(img2, file$1, 29, 12, 1078);
    			add_location(p2, file$1, 33, 12, 1219);
    			attr_dev(div2, "class", "svelte-f5vf8d");
    			add_location(div2, file$1, 28, 8, 1059);
    			attr_dev(div3, "class", "header svelte-f5vf8d");
    			add_location(div3, file$1, 16, 4, 632);
    			attr_dev(section, "id", "cost-panel");
    			attr_dev(section, "class", "svelte-f5vf8d");
    			add_location(section, file$1, 15, 0, 601);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div0);
    			append_dev(div0, img0);
    			append_dev(div0, t0);
    			append_dev(div0, p0);
    			append_dev(p0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, img1);
    			append_dev(div1, t3);
    			append_dev(div1, p1);
    			append_dev(p1, t4);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img2);
    			append_dev(div2, t6);
    			append_dev(div2, p2);
    			append_dev(p2, t7);
    			append_dev(div3, t8);
    			if (if_block) if_block.m(div3, null);
    			append_dev(section, t9);
    			mount_component(materialcostlist0, section, null);
    			append_dev(section, t10);
    			mount_component(materialcostlist1, section, null);
    			append_dev(section, t11);
    			mount_component(materialcostlist2, section, null);
    			append_dev(section, t12);
    			mount_component(materialcostlist3, section, null);
    			append_dev(section, t13);
    			mount_component(materialcostlist4, section, null);
    			append_dev(section, t14);
    			mount_component(materialcostlist5, section, null);
    			append_dev(section, t15);
    			mount_component(materialcostlist6, section, null);
    			append_dev(section, t16);
    			mount_component(materialcostlist7, section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$cost*/ 1) && t1_value !== (t1_value = format(/*$cost*/ ctx[0].mora.quantity) + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*$cost*/ 1) && t4_value !== (t4_value = format(Math.ceil(/*$cost*/ ctx[0].character_exp.quantity / 20000)) + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty & /*$cost*/ 1) && t7_value !== (t7_value = format(Math.ceil(/*$cost*/ ctx[0].weapon_exp.quantity / 10000)) + "")) set_data_dev(t7, t7_value);

    			if (/*$cost*/ ctx[0].crown.quantity > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			const materialcostlist0_changes = {};
    			if (dirty & /*$cost*/ 1) materialcostlist0_changes.list = /*$cost*/ ctx[0].local_specialty.list;
    			materialcostlist0.$set(materialcostlist0_changes);
    			const materialcostlist1_changes = {};
    			if (dirty & /*$cost*/ 1) materialcostlist1_changes.list = /*$cost*/ ctx[0].gem.list;
    			materialcostlist1.$set(materialcostlist1_changes);
    			const materialcostlist2_changes = {};
    			if (dirty & /*$cost*/ 1) materialcostlist2_changes.list = /*$cost*/ ctx[0].ascension_boss.list;
    			materialcostlist2.$set(materialcostlist2_changes);
    			const materialcostlist3_changes = {};
    			if (dirty & /*$cost*/ 1) materialcostlist3_changes.list = /*$cost*/ ctx[0].common.list;
    			materialcostlist3.$set(materialcostlist3_changes);
    			const materialcostlist4_changes = {};
    			if (dirty & /*$cost*/ 1) materialcostlist4_changes.list = /*$cost*/ ctx[0].book.list;
    			materialcostlist4.$set(materialcostlist4_changes);
    			const materialcostlist5_changes = {};
    			if (dirty & /*$cost*/ 1) materialcostlist5_changes.list = /*$cost*/ ctx[0].talent_boss.list;
    			materialcostlist5.$set(materialcostlist5_changes);
    			const materialcostlist6_changes = {};
    			if (dirty & /*$cost*/ 1) materialcostlist6_changes.list = /*$cost*/ ctx[0].elite.list;
    			materialcostlist6.$set(materialcostlist6_changes);
    			const materialcostlist7_changes = {};
    			if (dirty & /*$cost*/ 1) materialcostlist7_changes.list = /*$cost*/ ctx[0].wam.list;
    			materialcostlist7.$set(materialcostlist7_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(materialcostlist0.$$.fragment, local);
    			transition_in(materialcostlist1.$$.fragment, local);
    			transition_in(materialcostlist2.$$.fragment, local);
    			transition_in(materialcostlist3.$$.fragment, local);
    			transition_in(materialcostlist4.$$.fragment, local);
    			transition_in(materialcostlist5.$$.fragment, local);
    			transition_in(materialcostlist6.$$.fragment, local);
    			transition_in(materialcostlist7.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(materialcostlist0.$$.fragment, local);
    			transition_out(materialcostlist1.$$.fragment, local);
    			transition_out(materialcostlist2.$$.fragment, local);
    			transition_out(materialcostlist3.$$.fragment, local);
    			transition_out(materialcostlist4.$$.fragment, local);
    			transition_out(materialcostlist5.$$.fragment, local);
    			transition_out(materialcostlist6.$$.fragment, local);
    			transition_out(materialcostlist7.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    			destroy_component(materialcostlist0);
    			destroy_component(materialcostlist1);
    			destroy_component(materialcostlist2);
    			destroy_component(materialcostlist3);
    			destroy_component(materialcostlist4);
    			destroy_component(materialcostlist5);
    			destroy_component(materialcostlist6);
    			destroy_component(materialcostlist7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const formatter = new Intl.NumberFormat();
    const mora = genshin_data.items.find(i => i.id === 0);
    const hero_wit = genshin_data.items.find(i => i.id === 25);
    const mystic_ore = genshin_data.items.find(i => i.id === 57);
    const crown = genshin_data.items.find(i => i.id === 1504);

    function format(value) {
    	return formatter.format(value);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $cost;
    	validate_store(cost, 'cost');
    	component_subscribe($$self, cost, $$value => $$invalidate(0, $cost = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CostsPanel', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CostsPanel> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		genshin_data,
    		formatter,
    		mora,
    		hero_wit,
    		mystic_ore,
    		crown,
    		format,
    		MaterialCostList,
    		cost,
    		$cost
    	});

    	return [$cost];
    }

    class CostsPanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CostsPanel",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.55.1 */
    const file = "src\\App.svelte";

    // (10:1) {#if $selected_build != null}
    function create_if_block(ctx) {
    	let div;
    	let buildaccordion;
    	let t;
    	let costspanel;
    	let current;
    	buildaccordion = new BuildAccordion({ $$inline: true });
    	costspanel = new CostsPanel({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(buildaccordion.$$.fragment);
    			t = space();
    			create_component(costspanel.$$.fragment);
    			attr_dev(div, "class", "content svelte-1y19bwb");
    			add_location(div, file, 10, 2, 295);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(buildaccordion, div, null);
    			append_dev(div, t);
    			mount_component(costspanel, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buildaccordion.$$.fragment, local);
    			transition_in(costspanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buildaccordion.$$.fragment, local);
    			transition_out(costspanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(buildaccordion);
    			destroy_component(costspanel);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(10:1) {#if $selected_build != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let buildnavbar;
    	let t0;
    	let t1;
    	let style;
    	let current;
    	buildnavbar = new BuildNavbar({ $$inline: true });
    	let if_block = /*$selected_build*/ ctx[0] != null && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(buildnavbar.$$.fragment);
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			style = element("style");
    			style.textContent = "* {\n  box-sizing: border-box;\n}\n\n:root {\n  --primary-color: #542993;\n  --primary-highlight-color: #5f2fa7;\n  --primary-active-color: #49237f;\n  --primary-disabled-color: #773fc9;\n  --secondary-color: #14699b;\n  --secondary-highlight-color: #1778b2;\n  --secondary-active-color: #115a84;\n  --secondary-disabled-color: #1d97df;\n  --background-color: #262626;\n  --background-highlight-color: #333333;\n  --background-active-color: #191919;\n  --background-disabled-color: #4c4c4c;\n  --foreground-color: #eaeaea;\n  --foreground-highlight-color: #f7f7f7;\n  --foreground-active-color: #dddddd;\n  --foreground-disabled-color: white;\n  --border-color: #686868;\n  --border-highlight-color: #757575;\n  --border-active-color: #5b5b5b;\n  --border-disabled-color: #8e8e8e;\n  --error-color: #a80d24;\n  --error-highlight-color: #c00f29;\n  --error-active-color: #900b1f;\n  --error-disabled-color: #ed1535;\n}\n\nhtml,\nbody {\n  position: relative;\n  margin: 0;\n  padding: 0;\n}\n\nbody,\ndialog {\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen-Sans, Ubuntu, Cantarell, \"Helvetica Neue\", sans-serif;\n  font-size: 12pt;\n  color: var(--foreground-color);\n  background-color: var(--background-color);\n}\n\np,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nsmall,\nstrong,\nspan {\n  margin: 0;\n  line-height: 1;\n}\n\n::-webkit-scrollbar {\n  width: 7px;\n  height: 7px;\n}\n\n::-webkit-scrollbar-track {\n  background-color: var(--background-highlight-color);\n}\n\n::-webkit-scrollbar-thumb {\n  background-color: var(--border-color);\n}\n::-webkit-scrollbar-thumb:hover {\n  background-color: var(--border-highlight-color);\n}\n::-webkit-scrollbar-thumb:active {\n  background-color: var(--border-active-color);\n}\n\ninput[type=text],\ninput[type=number],\ntextarea,\nselect {\n  font-size: inherit;\n  outline: none;\n  padding: 0.5rem;\n  background-color: var(--background-color);\n  color: var(--foreground-color);\n  border: 2px solid var(--border-color);\n  transition: background-color 200ms, border-color 200ms, color 200ms;\n}\ninput[type=text]:hover,\ninput[type=number]:hover,\ntextarea:hover,\nselect:hover {\n  background-color: var(--background-highlight-color);\n  border-color: var(--border-highlight-color);\n  color: var(--foreground-highlight-color);\n}\ninput[type=text]:active, input[type=text]:focus,\ninput[type=number]:active,\ninput[type=number]:focus,\ntextarea:active,\ntextarea:focus,\nselect:active,\nselect:focus {\n  background-color: var(--background-active-color);\n  border-color: var(--border-active-color);\n  color: var(--foreground-active-color);\n}\ninput[type=text]::placeholder,\ninput[type=number]::placeholder,\ntextarea::placeholder,\nselect::placeholder {\n  color: var(--border-color);\n}\ninput[type=text]:invalid,\ninput[type=number]:invalid,\ntextarea:invalid,\nselect:invalid {\n  background-color: rgba(168, 13, 36, 0.15);\n  color: var(--error-color);\n  border-color: var(--error-color);\n}\ninput[type=text]:invalid:hover,\ninput[type=number]:invalid:hover,\ntextarea:invalid:hover,\nselect:invalid:hover {\n  background-color: rgba(168, 13, 36, 0.2);\n  color: var(--error-highlight-color);\n  border-color: var(--error-highlight-color);\n}\ninput[type=text]:invalid:focus, input[type=text]:invalid:active,\ninput[type=number]:invalid:focus,\ninput[type=number]:invalid:active,\ntextarea:invalid:focus,\ntextarea:invalid:active,\nselect:invalid:focus,\nselect:invalid:active {\n  background-color: rgba(168, 13, 36, 0.1);\n  color: var(--error-active-color);\n  border-color: var(--error-active-color);\n}\ninput[type=text]:invalid::placeholder,\ninput[type=number]:invalid::placeholder,\ntextarea:invalid::placeholder,\nselect:invalid::placeholder {\n  color: var(--error-disabled-color);\n}\n\nhr {\n  margin: 0.5rem;\n  border: none;\n  background-color: var(--border-color);\n  min-width: 2px;\n  min-height: 2px;\n}\n\nbutton,\ninput[type=button],\ninput[type=submit] {\n  outline: none;\n  border: none;\n  background: transparent;\n  color: var(--foreground-color);\n  stroke: var(--foreground-color);\n  padding: 0.25rem 1rem;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  transition: background-color 200ms, border-color 200ms, stroke 200ms, opacity 200ms;\n}\nbutton.icon,\ninput[type=button].icon,\ninput[type=submit].icon {\n  padding: 0.15rem;\n}\nbutton:disabled:not(.active), button[disabled]:not(.active),\ninput[type=button]:disabled:not(.active),\ninput[type=button][disabled]:not(.active),\ninput[type=submit]:disabled:not(.active),\ninput[type=submit][disabled]:not(.active) {\n  background-color: var(--background-disabled-color);\n  filter: opacity(0.5);\n}\nbutton:disabled.active, button[disabled].active,\ninput[type=button]:disabled.active,\ninput[type=button][disabled].active,\ninput[type=submit]:disabled.active,\ninput[type=submit][disabled].active {\n  background-color: var(--background-active-color);\n  color: var(--foreground-active-color);\n}\nbutton:not(:disabled):active, button:not(:disabled).active,\ninput[type=button]:not(:disabled):active,\ninput[type=button]:not(:disabled).active,\ninput[type=submit]:not(:disabled):active,\ninput[type=submit]:not(:disabled).active {\n  color: var(--foreground-active-color);\n  stroke: var(--foreground-active-color);\n  background-color: var(--background-active-color);\n}\nbutton:not(:disabled):hover,\ninput[type=button]:not(:disabled):hover,\ninput[type=submit]:not(:disabled):hover {\n  color: var(--foreground-highlight-color);\n  stroke: var(--foreground-highlight-color);\n  background-color: var(--background-highlight-color);\n}\n\ndialog {\n  padding: 0;\n  border: 2px solid var(--border-color);\n}\ndialog::backdrop {\n  backdrop-filter: blur(5px);\n}\n\n*:has(dialog[open]) {\n  overflow: hidden;\n}\n\n.horizontal-list {\n  display: flex;\n  gap: 0.5rem;\n  overflow-x: auto;\n  padding-block: 2px;\n}\n.horizontal-list img {\n  height: 100px;\n}";
    			attr_dev(div, "class", "body svelte-1y19bwb");
    			add_location(div, file, 6, 0, 224);
    			attr_dev(style, "lang", "scss");
    			add_location(style, file, 19, 1, 398);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(buildnavbar, div, null);
    			append_dev(div, t0);
    			if (if_block) if_block.m(div, null);
    			insert_dev(target, t1, anchor);
    			append_dev(document.head, style);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$selected_build*/ ctx[0] != null) {
    				if (if_block) {
    					if (dirty & /*$selected_build*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buildnavbar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buildnavbar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(buildnavbar);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t1);
    			detach_dev(style);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $selected_build;
    	validate_store(selected_build, 'selected_build');
    	component_subscribe($$self, selected_build, $$value => $$invalidate(0, $selected_build = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		BuildAccordion,
    		BuildNavbar,
    		CostsPanel,
    		selected_build,
    		$selected_build
    	});

    	return [$selected_build];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });
    // https://act.hoyolab.com/ys/app/interactive-map/index.html?lang=en-us#/map/2?shown_types=55,57,58,56,209,229,47,2,3,154&center=5674.50,2497.50&zoom=0.00
    // https://act.hoyolab.com/ys/app/interactive-map/index.html?lang=en-us#/map/2?shown_types=2,3,154,402&center=4516.66,-5620.96&zoom=-0.50
    // https://act.hoyolab.com/ys/app/interactive-map/index.html?lang=en-us#/map/2?shown_types=209,229,2,3,154,221&center=5026.00,-5397.00&zoom=-1.00
    // 126 exp book
    // 288 cristal
    // 2160000 mora
    // 5 fragile
    // 4 wish
    // 680 primo

    return app;

})();
//# sourceMappingURL=bundle.js.map
