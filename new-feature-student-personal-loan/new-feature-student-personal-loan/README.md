// Online Java Compiler
// Use this editor to write, compile and run your Java code online
import java.util.*;
import java.util.LinkedList;
import java.time.*;
import java.time.format.DateTimeFormatter;
class Main {
    public static Object resource1 = new Object();
    public static Object resource2 = new Object();
    public static final DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
    public static void main(String[] args) {
        simpleDeadLock();
        String str1 = "sunil1434";
        String str2 = "racecar12";
        String str3 = "racecar";
        String str4 = "racecar123";
        int[] a1 = {1,8,4,0,3,9,4};
        int[] a2 = {1,8,4,0,6,9,4};
        int[] a3 = {1,8,4,3,9,4};
        LinkedList<Integer> ll = toLinkedList(a1);
        Arrays.sort(a1);
        System.out.println("The Sorted array of a1 is:"+Arrays.toString(a1));
        System.out.println("The sorted array of a2 is:"+ Arrays.toString(sortArray(a2)));
        System.out.println("Original String is: "+str1+" and Reversed String is:" +reverse(str1));
        System.out.println("Original String is: "+str2+" and Reversed String is:" +reversed(str2));
        System.out.println("The String is Polyndrome:" + polyndromed(str3));
        System.out.println("The String is Polyndrome:" + polyndromed(str4));
        System.out.println("The String Contains Vowels:" + containsVowels(str4));
        System.out.println("Write the Linked list in reverse order:" + reveseLinkedList(ll));
        LinkedList<Integer> input = new LinkedList<>(List.of(100,400,600,800,300));
        System.out.println("Write the Linked list in decending order:" + descendOrderLinkedList(input));
        dateTimeFormatter();
        
    }
      
    
    
    
    public static String reverse(String input){
        StringBuilder out = new StringBuilder();
        char[] chars = input.toCharArray();
        for(int i = chars.length-1; i >= 0; i--){
            out.append(chars[i]);
        }
        return out.toString();
    }
    
    public static String reversed(String input){
        return new StringBuilder(input).reverse().toString();
    }
    
    public static boolean polyndrome(String input){
        return input.matches(new StringBuilder(input).reverse().toString());
    }
    public static boolean polyndromed(String input){
        int length = input.length();
        for(int i = 0;i < length/2; i++){
            if(input.charAt(i) != input.charAt(length-i-1))
            return false;
        }
        return true;
    }
    public static boolean containsVowels(String input){
        return input.toLowerCase().matches(".*[aeiou].*");
    }
    
    public static LinkedList<Integer> toLinkedList(int[] arr){
        LinkedList<Integer> list = new LinkedList<>();
        for(int i : arr){
            list.add(i);
        }
        return list;
    }
    
    public static LinkedList<Integer> reveseLinkedList(LinkedList<Integer> input){
        LinkedList<Integer> list = new LinkedList<>(input);
        //Collections.reverse(list);
        //list.reversed();
        LinkedList<Integer> ll1 = new LinkedList<>();
        list.descendingIterator().forEachRemaining(ll1::add);
        //System.out.println("Revesed Linkedlist is: " + ll1);
        return ll1;
    }
     public static LinkedList<Integer> descendOrderLinkedList(LinkedList<Integer> input){
        LinkedList<Integer> ll1 = new LinkedList<>(input);
        Collections.sort(ll1, Collections.reverseOrder());
        //System.out.println("Revesed Linkedlist is: " + ll1);
        return ll1;
    }
    
    public static void simpleDeadLock(){
        //Thread 1
        Thread t1 = new Thread(()->{
        synchronized(resource1){
            System.out.println("Thread 1: Locked resouce1");
        try{
            Thread.sleep(50);
        }catch(InterruptedException e){}
          System.out.println("Thread 1: trying to lock resouce2");
        synchronized(resource2){
            System.out.println("Thread 1: Locked resouce2");}
        
    }
}); 
//Thread 2
Thread t2 = new Thread(()->{
        synchronized(resource2){
            System.out.println("Thread 2: Locked resouce2");
        try{
            Thread.sleep(50);
        }catch(InterruptedException e){}
          System.out.println("Thread 2: trying to lock resouce1");
        synchronized(resource1){
            System.out.println("Thread 2: Locked resouce1");
        }
    }
});
t1.start();
t2.start();

}

public static int[] sortArray(int[] input){
    Arrays.sort(input);
    return input;
}

public static Integer[] toIneger(int[] arr){
    /*for(int i =0; i <arr.length<2; i++ ){
        temp = arr[i];
        arr[i]=arr[arr.length-i-1];
        arr[arr.length-i-1] = temp;
    }
    Integer[] result = new Integer[arr.length];
    for(int i=0; i<arr.length; i++){
        result[i] = arr[i];
    }
    return result;*/
    return Arrays.stream(arr).boxed().toArray(Integer[]::new);
    
}
public static void dateTimeFormatter(){
    LocalTime date = LocalTime.now();
    String formatedDate = date.format(dateFormat);
    System.out.println("The Date is:" + formatedDate);
    
}
    
}
