export interface TemplateSpecs {
  main:(locals:Record<string,unknown>)=>string;
}