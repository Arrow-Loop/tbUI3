# Equivalent Win32 API probe, not a compiled twinBASIC-control acceptance test.
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class TabRepaintProbe {
 [StructLayout(LayoutKind.Sequential)] struct Rect {public int left,top,right,bottom;}
 delegate IntPtr Subclass(IntPtr h,uint m,IntPtr w,IntPtr l,UIntPtr id,IntPtr data);
 static int erased,forwarded;
 [DllImport("user32",CharSet=CharSet.Unicode)] static extern IntPtr CreateWindowExW(uint ex,string cls,string title,uint style,int x,int y,int w,int h,IntPtr parent,IntPtr menu,IntPtr instance,IntPtr param);
 [DllImport("user32")] static extern bool DestroyWindow(IntPtr h);
 [DllImport("user32")] static extern bool InvalidateRect(IntPtr h,ref Rect r,bool erase);
 [DllImport("user32")] static extern bool ValidateRect(IntPtr h,IntPtr r);
 [DllImport("user32")] static extern bool GetUpdateRect(IntPtr h,out Rect r,bool erase);
 [DllImport("user32")] static extern bool GetClientRect(IntPtr h,out Rect r);
 [DllImport("user32")] static extern IntPtr SendMessageW(IntPtr h,uint m,IntPtr w,IntPtr l);
 [DllImport("comctl32")] static extern bool SetWindowSubclass(IntPtr h,Subclass fn,UIntPtr id,IntPtr data);
 [DllImport("comctl32")] static extern bool RemoveWindowSubclass(IntPtr h,Subclass fn,UIntPtr id);
 [DllImport("comctl32")] static extern IntPtr DefSubclassProc(IntPtr h,uint m,IntPtr w,IntPtr l);
 static IntPtr Proc(IntPtr h,uint m,IntPtr w,IntPtr l,UIntPtr id,IntPtr data){if(m==0x14){erased++;return new IntPtr(1);}forwarded++;return DefSubclassProc(h,m,w,l);}
 static void Check(bool ok,string msg){if(!ok)throw new Exception(msg);}
 public static string Run(){
  IntPtr h=CreateWindowExW(0x08000080,"STATIC","tbUI3 offscreen repaint probe",0x90000000,-32000,-32000,640,480,IntPtr.Zero,IntPtr.Zero,IntPtr.Zero,IntPtr.Zero);
  Check(h!=IntPtr.Zero,"CreateWindow");Subclass proc=Proc;UIntPtr id=new UIntPtr(0x55493354);
  try{
   Check(SetWindowSubclass(h,proc,id,IntPtr.Zero),"SetWindowSubclass");
   foreach(int dpi in new int[]{96,120,144,168,192}){
    ValidateRect(h,IntPtr.Zero);Rect client;Check(GetClientRect(h,out client),"GetClientRect");
    client.bottom=Math.Min(client.bottom,(int)Math.Ceiling(40*dpi/96.0));
    for(int i=0;i<100;i++)Check(InvalidateRect(h,ref client,false),"InvalidateRect");
    Rect update;Check(GetUpdateRect(h,out update,false),"GetUpdateRect");
    Check(update.left==0&&update.top==0&&update.right==640&&update.bottom==client.bottom,"Header-only update at DPI "+dpi);
    Check(erased==0,"Unexpected background erase during invalidation");
   }
   int before=forwarded;Check(SendMessageW(h,0x14,IntPtr.Zero,IntPtr.Zero)==new IntPtr(1),"WM_ERASEBKGND handled");
   Check(erased==1&&forwarded==before,"Background erase reached default brush");
   return "PASS "+(IntPtr.Size*8)+"-bit: 500 no-erase header invalidations at 96/120/144/168/192 DPI; erase handled without default-brush forwarding";
  }finally{RemoveWindowSubclass(h,proc,id);DestroyWindow(h);GC.KeepAlive(proc);}
 }
}
"@
[TabRepaintProbe]::Run()
