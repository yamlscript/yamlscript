export interface TemplateSpecs {
  main:(locals:Record<string,unknown>)=>string;
}

export type LevelName = "debug" | "info" | "warn" | "error" | "fatal";

export enum Level {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4,
}