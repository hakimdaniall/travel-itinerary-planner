declare module "jspdf-autotable" {
  import { jsPDF } from "jspdf";

  interface CellDef {
    content?: string;
    colSpan?: number;
    rowSpan?: number;
    styles?: any;
  }

  interface ColumnStyles {
    [key: string]: {
      cellWidth?: number | "auto" | "wrap";
      minCellWidth?: number;
      halign?: "left" | "center" | "right";
      valign?: "top" | "middle" | "bottom";
      fontSize?: number;
      cellPadding?: number;
      lineColor?: number | number[];
      lineWidth?: number;
      fontStyle?: "normal" | "bold" | "italic" | "bolditalic";
      overflow?: "linebreak" | "ellipsize" | "visible" | "hidden";
      fillColor?: number | number[] | false;
      textColor?: number | number[];
      minCellHeight?: number;
    };
  }

  interface Styles {
    font?: string;
    fontStyle?: "normal" | "bold" | "italic" | "bolditalic";
    overflow?: "linebreak" | "ellipsize" | "visible" | "hidden";
    fillColor?: number | number[] | false;
    textColor?: number | number[];
    halign?: "left" | "center" | "right";
    valign?: "top" | "middle" | "bottom";
    fontSize?: number;
    cellPadding?: number;
    lineColor?: number | number[];
    lineWidth?: number;
    minCellHeight?: number;
    minCellWidth?: number;
    cellWidth?: number | "auto" | "wrap";
  }

  interface Options {
    head?: (string | CellDef)[][];
    body?: (string | number | CellDef)[][];
    foot?: (string | CellDef)[][];
    startY?: number;
    margin?:
      | number
      | { top?: number; right?: number; bottom?: number; left?: number };
    pageBreak?: "auto" | "avoid" | "always";
    rowPageBreak?: "auto" | "avoid";
    tableWidth?: "auto" | "wrap" | number;
    showHead?: "everyPage" | "firstPage" | "never";
    showFoot?: "everyPage" | "lastPage" | "never";
    tableLineColor?: number | number[];
    tableLineWidth?: number;
    styles?: Styles;
    headStyles?: Styles;
    bodyStyles?: Styles;
    footStyles?: Styles;
    alternateRowStyles?: Styles;
    columnStyles?: ColumnStyles;
    theme?: "striped" | "grid" | "plain";
    didDrawPage?: (data: any) => void;
    didDrawCell?: (data: any) => void;
    willDrawCell?: (data: any) => void;
    didParseCell?: (data: any) => void;
  }

  export default function autoTable(doc: jsPDF, options: Options): void;
}
