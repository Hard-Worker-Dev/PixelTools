// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { extractPdfPages, reorderPdfPages, rotatePdfFile } from "./pdf-page-operations";

function readZip(bytes: Uint8Array): Array<{name:string;bytes:Uint8Array}> {
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength), decoder=new TextDecoder();
  const entries:Array<{name:string;bytes:Uint8Array}>=[];
  let offset=0;
  while(offset+30<=bytes.length&&view.getUint32(offset,true)===0x04034b50){
    const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true);
    const nameStart=offset+30,dataStart=nameStart+nameLength+extraLength,dataEnd=dataStart+size;
    if(dataEnd>bytes.length)throw new Error("Invalid ZIP entry.");
    entries.push({name:decoder.decode(bytes.subarray(nameStart,nameStart+nameLength)),bytes:bytes.slice(dataStart,dataEnd)});
    offset=dataEnd;
  }
  return entries;
}
async function makePdf(name="pages.pdf",count=4):Promise<File>{
  const doc=await PDFDocument.create();
  for(let i=0;i<count;i++)doc.addPage([300+i*10,400+i*10]);
  return new File([await doc.save()],name,{type:"application/pdf"});
}

describe("PDF page operations",()=>{
  it("rotates every page by the requested clockwise quarter-turn",async()=>{
    const output=await rotatePdfFile(await makePdf(),1);
    const doc=await PDFDocument.load(await output.arrayBuffer());
    expect(doc.getPages().map(page=>page.getRotation().angle)).toEqual([90,90,90,90]);
  });
  it("preserves existing page rotation when applying an additional turn",async()=>{
    const source=await PDFDocument.create();const page=source.addPage([300,400]);page.setRotation({type:"degrees",angle:180});
    const file=new File([await source.save()],"turned.pdf",{type:"application/pdf"});
    const output=await rotatePdfFile(file,1);const doc=await PDFDocument.load(await output.arrayBuffer());
    expect(doc.getPage(0).getRotation().angle).toBe(270);
  });
  it("reorders pages and preserves their original dimensions",async()=>{
    const output=await reorderPdfPages(await makePdf(),[2,0,3,1]);
    const doc=await PDFDocument.load(await output.arrayBuffer());
    expect(doc.getPages().map(page=>page.getWidth())).toEqual([320,300,330,310]);
  });
  it("rejects incomplete, duplicate and invalid page permutations",async()=>{
    const file=await makePdf();
    await expect(reorderPdfPages(file,[0,1])).rejects.toThrow("every page exactly once");
    await expect(reorderPdfPages(file,[0,1,1,3])).rejects.toThrow("every page exactly once");
    await expect(reorderPdfPages(file,[0,1,2,9])).rejects.toThrow("every page exactly once");
  });
  it("extracts selected pages as independently readable PDFs in a ZIP",async()=>{
    const archive=await extractPdfPages(await makePdf("report.pdf",5),[4,1]);
    const entries=readZip(new Uint8Array(await archive.arrayBuffer()));
    expect(entries.map(entry=>entry.name)).toEqual(["report-page-2.pdf","report-page-5.pdf"]);
    const first=await PDFDocument.load(entries[0].bytes),second=await PDFDocument.load(entries[1].bytes);
    expect(first.getPageCount()).toBe(1);expect(first.getPage(0).getWidth()).toBe(310);
    expect(second.getPageCount()).toBe(1);expect(second.getPage(0).getWidth()).toBe(340);
  });
  it("rejects empty and out-of-bounds extraction selections",async()=>{
    const file=await makePdf();
    await expect(extractPdfPages(file,[])).rejects.toThrow("Select at least one");
    await expect(extractPdfPages(file,[4])).rejects.toThrow("Select at least one");
  });
  it("rejects invalid rotation settings",async()=>{
    await expect(rotatePdfFile(await makePdf(),0)).rejects.toThrow("Choose a rotation");
    await expect(rotatePdfFile(await makePdf(),4)).rejects.toThrow("Choose a rotation");
  });
});
