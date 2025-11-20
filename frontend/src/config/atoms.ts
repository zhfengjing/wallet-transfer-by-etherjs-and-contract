import { atom } from 'jotai';

// 交易历史记录
export const transferHistoryAtom = atom<any[]>([]);

// 当前选中的地址
export const selectedAddressAtom = atom<string | null>(null);

// 加载状态
export const isLoadingAtom = atom<boolean>(false);
