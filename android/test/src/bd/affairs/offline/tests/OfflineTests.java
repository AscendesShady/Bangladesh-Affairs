package bd.affairs.offline.tests;
import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import org.json.JSONArray;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

public final class OfflineTests extends Instrumentation {
    private WebView web; private Activity activity; private int checks;
    @Override public void onCreate(Bundle arguments) { super.onCreate(arguments);start(); }
    private WebView find(View view) {
        if(view instanceof WebView)return (WebView)view;
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++){WebView result=find(group.getChildAt(i));if(result!=null)return result;}}
        return null;
    }
    private String js(final String expression) throws Exception {
        final CountDownLatch done=new CountDownLatch(1);final AtomicReference<String> value=new AtomicReference<>();
        runOnMainSync(new Runnable(){@Override public void run(){web.evaluateJavascript(expression,new ValueCallback<String>(){@Override public void onReceiveValue(String result){value.set(result);done.countDown();}});}});
        if(!done.await(45,TimeUnit.SECONDS))throw new AssertionError("WebView JavaScript timed out");return value.get();
    }
    private void check(boolean value,String label) {if(!value)throw new AssertionError(label);checks++;android.util.Log.i("BangladeshAffairsQA","PASS "+label);}
    private void dom(String expression,String label) throws Exception {check("true".equals(js(expression)),label);}
    private void waitForMap() throws Exception {
        long end=SystemClock.uptimeMillis()+90000;
        while(SystemClock.uptimeMillis()<end){if("true".equals(js("document.querySelectorAll('.district').length===64&&document.querySelector('#map-loading').hidden")))return;Thread.sleep(500);}
        throw new AssertionError("Native app stayed on Loading");
    }
    private void event(final long down,final int action,final float[][] points) {
        final MotionEvent.PointerProperties[] properties=new MotionEvent.PointerProperties[points.length];final MotionEvent.PointerCoords[] coords=new MotionEvent.PointerCoords[points.length];
        for(int i=0;i<points.length;i++){properties[i]=new MotionEvent.PointerProperties();properties[i].id=i;properties[i].toolType=MotionEvent.TOOL_TYPE_FINGER;coords[i]=new MotionEvent.PointerCoords();coords[i].x=points[i][0];coords[i].y=points[i][1];coords[i].pressure=1;coords[i].size=0.1f;}
        runOnMainSync(new Runnable(){@Override public void run(){MotionEvent event=MotionEvent.obtain(down,SystemClock.uptimeMillis(),action,points.length,properties,coords,0,0,1,1,0,0,InputDevice.SOURCE_TOUCHSCREEN,0);web.dispatchTouchEvent(event);event.recycle();}});
    }
    private void pinch() throws Exception {
        js("document.querySelector('#map').scrollIntoView({block:'center'});");Thread.sleep(300);
        JSONArray bounds=new JSONArray(js("(function(){var r=document.querySelector('#map').getBoundingClientRect();return [r.left+r.width*0.55,r.top+r.height*0.48,devicePixelRatio];})()"));
        float x=(float)bounds.getDouble(0),y=(float)bounds.getDouble(1),ratio=(float)bounds.getDouble(2);long down=SystemClock.uptimeMillis();
        event(down,MotionEvent.ACTION_DOWN,new float[][]{{(x-35)*ratio,y*ratio}});
        event(down,MotionEvent.ACTION_POINTER_DOWN|(1<<MotionEvent.ACTION_POINTER_INDEX_SHIFT),new float[][]{{(x-35)*ratio,y*ratio},{(x+35)*ratio,y*ratio}});
        for(int i=1;i<=8;i++){float distance=35+i*4;event(down,MotionEvent.ACTION_MOVE,new float[][]{{(x-distance)*ratio,y*ratio},{(x+distance)*ratio,y*ratio}});Thread.sleep(45);}
        event(down,MotionEvent.ACTION_POINTER_UP|(1<<MotionEvent.ACTION_POINTER_INDEX_SHIFT),new float[][]{{(x-67)*ratio,y*ratio},{(x+67)*ratio,y*ratio}});
        event(down,MotionEvent.ACTION_UP,new float[][]{{(x-67)*ratio,y*ratio}});Thread.sleep(300);
        dom("document.querySelector('#geography').transform.baseVal.consolidate().matrix.a>1.3","Native two-finger pinch zooms the map");
        dom("Math.abs(visualViewport.scale-1)<0.01","Pinch does not zoom the page");
    }
    @Override public void onStart() {
        Bundle result=new Bundle();
        try {
            Intent launch=getTargetContext().getPackageManager().getLaunchIntentForPackage("bd.affairs.offline");launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);activity=startActivitySync(launch);
            runOnMainSync(new Runnable(){@Override public void run(){web=find(activity.findViewById(android.R.id.content));}});
            check(web!=null,"Native WebView created");waitForMap();
            check(getTargetContext().checkCallingOrSelfPermission("android.permission.INTERNET")==PackageManager.PERMISSION_DENIED,"APK has no internet permission");
            dom("document.querySelectorAll('.district').length===64","64 districts render from APK");
            dom("document.querySelector('#app-recovery').hidden","No startup error");
            dom("!document.querySelector('#install')&&!document.querySelector('link[rel=manifest]')","Website installer removed");
            js("document.querySelector('#directory [data-district=Dhaka]').click();");dom("document.querySelector('#detail h2').textContent==='Dhaka'","District detail opens");
            js("document.querySelector('[data-tab=facts]').click();");dom("document.querySelectorAll('.fact-card').length===91","91 facts render offline");
            js("document.querySelector('[data-save=\"fact-1\"]').click();");dom("JSON.parse(localStorage.getItem('ba-saved')).indexOf('fact-1')>=0","Save card on device");
            js("document.querySelector('[data-tab=syllabus]').click();");dom("document.querySelectorAll('.syllabus-card').length===14","14 syllabus topics");
            dom("Array.from(document.querySelectorAll('.source-images img')).every(function(i){return i.complete&&i.naturalWidth>0;})","Original images bundled");
            dom("document.fonts.check('16px AtlasBangla')","Bengali font bundled");
            js("document.querySelector('[data-tab=map]').click();document.querySelector('[data-layer=gi]').click();");dom("document.querySelectorAll('.directory-item').length===64","64 GI records offline");
            js("document.querySelector('[data-layer=communities]').click();");dom("document.querySelectorAll('.directory-item').length===20","20 community profiles offline");
            js("document.querySelector('[data-layer=history]').click();var s=document.querySelector('#timeline-slider');s.value=0;s.dispatchEvent(new Event('input',{bubbles:true}));");dom("document.querySelector('#timeline-date').textContent.indexOf('3rd century')>=0","First history stop");
            js("var s=document.querySelector('#timeline-slider');s.value=23;s.dispatchEvent(new Event('input',{bubbles:true}));");dom("document.querySelector('#timeline-date').textContent.indexOf('June 2026')>=0","Last history stop");
            js("document.querySelector('[data-layer=districts]').click();document.querySelector('#clear').click();");pinch();
            js("document.querySelector('#zoom-reset').click();document.querySelector('#about').click();");dom("document.querySelector('#sources-dialog').open","Source notes open");
            runOnMainSync(new Runnable(){@Override public void run(){activity.onBackPressed();}});Thread.sleep(300);dom("!document.querySelector('#sources-dialog').open","Android Back closes dialog");
            js("location.reload();");waitForMap();dom("JSON.parse(localStorage.getItem('ba-saved')).indexOf('fact-1')>=0","Saved progress survives native reload");
            dom("document.querySelector('#map-loading').hidden&&document.querySelector('#app-recovery').hidden","Offline reload completes");
            result.putString("stream",checks+" native Android checks passed, without internet permission.\n");result.putInt("checks",checks);finish(Activity.RESULT_OK,result);
        } catch(Throwable error){result.putString("stream","FAILED after "+checks+" checks: "+error.toString()+"\n");android.util.Log.e("BangladeshAffairsQA","FAILED",error);finish(Activity.RESULT_CANCELED,result);}
    }
}
