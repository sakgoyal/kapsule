// @ts-nocheck
import debounce from 'lodash-es/debounce';

export interface State {
  initialised: boolean;
  _rerender: () => void;
  [stateItem: string]: any;
}
export type InitOptions = Record<string, unknown>;
export interface PropCfg {
  default?: any;
  onChange?(newVal: any, state: State, prevVal: any): void;
  triggerUpdate?: boolean;
}

export type MethodCfg = (state: State, ...args: any[]) => any;
export interface KapsuleCfg {
  props?: { [prop: string]: PropCfg };
  methods?: { [method: string]: MethodCfg };
  aliases?: { [propOrMethod: string]: string };
  stateInit?: (initOptions?: InitOptions) => Partial<State>;
  init?: (
    contructorItem?: any,
    state?: State,
    initOptions?: InitOptions
  ) => void;
  update: (state?: State, changedProps?: { [prop: string]: any }) => void;
}
export type PropGetter = () => any;
export type PropSetter = (val: any) => KapsuleInstance;
export type KapsuleMethod = (...args: any[]) => any;

export interface KapsuleInstance {
  (constructorItem: any): KapsuleInstance;
  resetProps(): KapsuleInstance;
  [propOrMethod: string]: PropGetter | PropSetter | KapsuleMethod;
}

export type KapsuleClosure = (initOptions?: InitOptions) => KapsuleInstance;

class Prop {
  name : string
  defaultVal : any
  triggerUpdate : boolean
  onChange : (newVal: any, state: State, prevVal: any) => void;

  constructor(name : string, {
    default: defaultVal = null,
    triggerUpdate = true,
    onChange = (newVal: any, state: State) => {}
  }) {
    this.name = name;
    this.defaultVal = defaultVal;
    this.triggerUpdate = triggerUpdate;
    this.onChange = onChange;
  }
}

export function Kapsule({
  stateInit = (() => ({})),
  props: rawProps = {},
  methods = {},
  aliases = {},
  init: initFn = (() => {}),
  update: updateFn = (() => {})
} : KapsuleCfg) : KapsuleClosure {

  // Parse props into Prop instances
  const props = Object.keys(rawProps).map(propName =>
    // @ts-ignore
    new Prop(propName, rawProps[propName])
  );

  return function(options = {}) {

    // Holds component state
    let state = {
      ...(stateInit instanceof Function ? stateInit(options) : stateInit), // Support plain objects for backwards compatibility
      initialised: false
    };

    // keeps track of which props triggered an update
    let changedProps = {};

    // Component constructor
    function comp(nodeElement) {
      initStatic(nodeElement, options);
      digest();

      return comp;
    }

    function initStatic(nodeElement, options) {
      initFn.call(comp, nodeElement, state, options);
      state.initialised = true;
    };

    const digest = debounce(() => {
      if (!state.initialised) { return; }
      updateFn.call(comp, state, changedProps);
      changedProps = {};
    }, 1);

    // Getter/setter methods
    props.forEach(prop => {
      comp[prop.name] = getSetProp(prop);

      function getSetProp({
        name: prop,
        triggerUpdate: redigest = false,
        onChange = (newVal, state : State) => {},
        defaultVal = null
      }) {
        return function(_) {
          const curVal = state[prop];
          if (!arguments.length) { return curVal } // Getter mode

          const val = _ === undefined ? defaultVal : _; // pick default if value passed is undefined
          state[prop] = val;
          onChange.call(comp, val, state, curVal);

          // track changed props
          !changedProps.hasOwnProperty(prop) && (changedProps[prop] = curVal);

          if (redigest) { digest(); }
          return comp;
        }
      }
    });

    // Other methods
    for (const methodName in methods) {
      comp[methodName] = (...args) => methods[methodName].call(comp, state, ...args);
    }

    // Link aliases
    for (const [alias, target] of Object.entries(aliases)) {
      comp[alias] = comp[target];
    }

    // Reset all component props to their default value
    comp.resetProps = function() {
      props.forEach(prop => {
        comp[prop.name](prop.defaultVal);
      });
      return comp;
    };

    comp.resetProps(); // Apply all prop defaults
    state._rerender = digest; // Expose digest method

    return comp;
  }
}
