// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { watermarkPdfFile } from "./pdf-watermark";

async function makePdf(count=2): Promise<File> {
  const doc=await PDFDocument.create();
  for(let i=0;i<count;i++)doc.addPage([300,400]);
  return new File([await doc.save()],"source.pdf",{type:"application/pdf"});
}

describe("PDF watermark",()=>{
  it("adds watermark text to every page and keeps the page count and dimensions",async()=>{
    const output=await watermarkPdfFile(await makePdf(),{text:"CONFIDENTIAL",color:"#ff0000",opacity:0.35,fontSize:24,rotation:-30,position:"center"});
    const pdf=await PDFDocument.load(await output.arrayBuffer());
    expect(pdf.getPageCount()).toBe(2);
    expect(pdf.getPage(0).getWidth()).toBe(300);
    expect(pdf.getPage(1).getHeight()).toBe(400);
    const page=pdf.getPage(0);
    const contents=page.node.Contents();
    expect(contents).toBeTruthy();
  });
  it("accepts each supported corner and center placement",async()=>{
    for(const position of ["center","top-left","top-right","bottom-left","bottom-right"] as const){
      const output=await watermarkPdfFile(await makePdf(1),{text:"DRAFT",color:"#202020",opacity:1,fontSize:12,rotation:0,position});
      expect((await PDFDocument.load(await output.arrayBuffer())).getPageCount()).toBe(1);
    }
  });
  it("rejects empty, too-long and non-ASCII text",async()=>{
    const file=await makePdf(1),base={color:"#000000",opacity:0.5,fontSize:20,rotation:0,position:"center" as const};
    await expect(watermarkPdfFile(file,{...base,text:"  "})).rejects.toThrow("Enter watermark text");
    await expect(watermarkPdfFile(file,{...base,text:"x".repeat(121)})).rejects.toThrow("120 characters");
    await expect(watermarkPdfFile(file,{...base,text:"مرحبا"})).rejects.toThrow("basic English");
  });
  it("rejects invalid color, opacity, size and rotation",async()=>{
    const file=await makePdf(1),base={text:"DRAFT",color:"#000000",opacity:0.5,fontSize:20,rotation:0,position:"center" as const};
    await expect(watermarkPdfFile(file,{...base,color:"red"})).rejects.toThrow("HEX color");
    await expect(watermarkPdfFile(file,{...base,opacity:1.1})).rejects.toThrow("Opacity");
    await expect(watermarkPdfFile(file,{...base,fontSize:7})).rejects.toThrow("Font size");
    await expect(watermarkPdfFile(file,{...base,rotation:91})).rejects.toThrow("Rotation");
  });
  it("does not modify the original source file bytes",async()=>{
    const file=await makePdf(1),before=new Uint8Array(await file.arrayBuffer());
    await watermarkPdfFile(file,{text:"COPY",color:"#333333",opacity:0.2,fontSize:16,rotation:15,position:"bottom-right"});
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(before);
  });
});
