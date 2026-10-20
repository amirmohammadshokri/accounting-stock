import { LogoUploadComponent } from './logo-upload.component';
describe('Logo file attachment',()=>{
  function event(file:File):Event {const input=document.createElement('input');input.type='file';const transfer=new DataTransfer();transfer.items.add(file);input.files=transfer.files;return {target:input} as unknown as Event;}
  it('accepts a real attached image, previews it and supports removal',async()=>{
    const form=new LogoUploadComponent();const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFfoAAAAASUVORK5CYII=';
    const bytes=Uint8Array.from(atob(png),c=>c.charCodeAt(0));
    const value=await new Promise<string|null>(resolve=>{form.registerOnChange(resolve);form.select(event(new File([bytes],'logo.png',{type:'image/png'})));});
    expect(value).toContain('data:image/png;base64,');expect(form.preview).toBe(value);
    const changed=jasmine.createSpy();form.registerOnChange(changed);form.clear();expect(changed).toHaveBeenCalledWith(null);expect(form.preview).toBeNull();
  });
  it('rejects non-images and files over 300 KB without changing the current logo',()=>{
    const form=new LogoUploadComponent();const changed=jasmine.createSpy();form.registerOnChange(changed);
    form.select(event(new File(['text'],'logo.txt',{type:'text/plain'})));expect(form.error).toBeTruthy();
    form.select(event(new File([new Uint8Array(307201)],'large.png',{type:'image/png'})));expect(form.error).toBeTruthy();expect(changed).not.toHaveBeenCalled();
  });
});
