import { Sprint } from "./sprint";

export type BurndownGlobal = {
  burndown: BurndownData[];
  sprint: Sprint;
};

export type BurndownData = {
  date: string;
  remaining: number;
  remainingAim: number;
  runningTotal: number;
};