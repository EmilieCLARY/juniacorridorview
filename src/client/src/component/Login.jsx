import React,{useState,useEffect} from 'react'
import {NavLink, useHistory} from 'react-router-dom'
import * as api from '../api/AxiosLogin';


const Login = () => {
    const [user, setUser] = useState({
        email:"",
        password:""
    })
    
    const [show,setShow]= useState(false);
    const [msg,setMsg]= useState("");

    const his = useHistory();

    const onSub=async (e) => {
        e.preventDefault();
        let val = await api.postLogin(user);
        console.log(val);
        setShow(val.login);
        if(val.data.msg){
            setMsg(val.data.msg);
        }
    }

    useEffect(() => {
        if(show){
            his.push("/profile");
        }
    }, [show])

    useEffect(() => {
       const checkLogin= async ()=>{
        let val= await api.getLogin();
        console.log(val);
        if(val.user){
            his.push("/profile")
        }
       }
       checkLogin();
    }, [])



    const userInput=(event)=>{
        const {name,value}=event.target;
        setUser((prev)=>{
            return {
                ...prev,
                [name]:value
            }
        })

    }
    return (
        <>
       <div className="container" id="formm">
       <div className="row">
           <div className="col-lg-6 col-md-8 col-12 mx-auto">

               {
                  msg ? (
                       <>
                      <div class="alert alert-danger alert-dismissible">
  <button type="button" class="close" data-dismiss="alert">&times;</button>
  <strong>ERROR!</strong> {msg}
</div>
                       
                       
                       </>
                   ):null
               }
               <br />
           <form onSubmit={onSub}>
  <div className="form-group">
    <label >Email address:</label>
    <input type="email" className="form-control" placeholder="Enter email" name="email" value={user.email} onChange={userInput} required />
  </div>
  <div className="form-group">
    <label for="pwd">Password:</label>
    <input type="password" className="form-control" placeholder="Enter password" name="password" value={user.password} onChange={userInput}  required/>
  </div>
  
  <button type="submit" className="btn btn-primary">Submit</button>
</form>
<br />
<NavLink to="/register">create a account </NavLink>

           </div>
          
       </div>
       </div>
            
        </>
    )
}

export default Login
