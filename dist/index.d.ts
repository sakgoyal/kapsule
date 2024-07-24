interface State {
    initialised: boolean;
    _rerender: () => void;
    [stateItem: string]: any;
}
type InitOptions = Record<string, unknown>;
interface PropCfg {
    default?: any;
    onChange?(newVal: any, state: State, prevVal: any): void;
    triggerUpdate?: boolean;
}
type MethodCfg = (state: State, ...args: any[]) => any;
interface KapsuleCfg {
    props?: {
        [prop: string]: PropCfg;
    };
    methods?: {
        [method: string]: MethodCfg;
    };
    aliases?: {
        [propOrMethod: string]: string;
    };
    stateInit?: (initOptions?: InitOptions) => Partial<State>;
    init?: (contructorItem?: any, state?: State, initOptions?: InitOptions) => void;
    update: (state?: State, changedProps?: {
        [prop: string]: any;
    }) => void;
}
type PropGetter = () => any;
type PropSetter = (val: any) => KapsuleInstance;
type KapsuleMethod = (...args: any[]) => any;
interface KapsuleInstance {
    (constructorItem: any): KapsuleInstance;
    resetProps(): KapsuleInstance;
    [propOrMethod: string]: PropGetter | PropSetter | KapsuleMethod;
}
type KapsuleClosure = (initOptions?: InitOptions) => KapsuleInstance;
declare function Kapsule({ stateInit, props: rawProps, methods, aliases, init: initFn, update: updateFn }: KapsuleCfg): KapsuleClosure;

export { type InitOptions, Kapsule, type KapsuleCfg, type KapsuleClosure, type KapsuleInstance, type KapsuleMethod, type MethodCfg, type PropCfg, type PropGetter, type PropSetter, type State };
