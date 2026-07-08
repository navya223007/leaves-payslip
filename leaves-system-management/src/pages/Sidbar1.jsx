import { useState } from "react";
import logo from './logo.svg'
import './Sidbar1.css'
 const navItems=["home" ...]

 const Sidbar1=()=>{
    const [isOpen,setIsOpen]=useState(false);
    return(
        <aside className={`sidbar ${isOpen ? "open": " "}`}>
            <div className={inner}>
                <header>
                    <button type="button" onClick={()=>setIsOpen(!isOpen)}>
                        <span className="material...">
                        {isOpen ? "close" : "menu"}
                        </span>
                    </button>
                        <img src="{logo}"  />   
                </header>
                <nav>
                    {navItems.map(item=>{
                        <button kwy{item} type="button">
                            <span className=""matreial...">{item}</span>
                        </button>
    
                    })}
                </nav>
            </div>

        </aside>
    )

 }
 
