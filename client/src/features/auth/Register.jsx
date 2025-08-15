import React, { useState } from 'react';
import './Register.css';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import video from '../../assets/video.mp4';
import logo from '../../assets/logo.png';
import { MdEmail } from 'react-icons/md';
import { FaUserShield } from 'react-icons/fa';
import { BsFillShieldLockFill } from 'react-icons/bs';
import { AiOutlineSwapRight } from 'react-icons/ai';

const Register = () => {
  const [correo, setCorreo] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');

  const crearUsuario = (e) => {
    e.preventDefault();
    api.post('/register', {
      correo: correo,
      nombre_usuario: nombreUsuario,
      contraseña: contraseña,
    })
      .then(() => console.log('Usuario creado'))
      .catch((err) => console.error(err));
  };

  return (
    //inicio viejo codigo
    <div className='registerPage flex'>
      <div className='container flex'>

        <div className="videoDiv">
          <video src={video} autoPlay muted loop></video>

          <div className="textDiv">
            <h2 className='title'>Conecta con profesional del hogar de todos los rubros</h2>
            <p>Vive la tranquilidad del hogar</p>
          </div>

          <div className='footerDiv flex'>
            <span className='text'>Have an account?</span>
            <Link to={'/'}>
              <button className='btn'>Login</button>
            </Link>
          </div>
        </div>

        <div className='formDiv flex'>
          <div className='headerDiv'>
            <img src={logo} alt='Logo Image' />
            <h3>Let Us Know You</h3>
          </div>

          <form action='' className='form grid'>

            <div className='inputDiv'>
              <label htmlFor='correo'>Correo Electónico</label>
              <div className='input flex'>
                <MdEmail className='icon' />
                <input type='email' id='correo' placeholder='Ingrese su correo'
                  onChange={(event) => {
                    setCorreo(event.target.value)
                  }} />
              </div>
            </div>
            <div className='inputDiv'>
              <label htmlFor='nombreUsuario'>Nombre de Usuario</label>
              <div className='input flex'>
                <FaUserShield className='icon' />
                <input type='text' id='nombreUsuario' placeholder='Ingrese nombre de usuario'
                  onChange={(event) => {
                    setNombreUsuario(event.target.value)
                  }} />
              </div>
            </div>

            <div className='inputDiv'>
              <label htmlFor='contraseña'>Contraseña</label>
              <div className='input flex'>
                <BsFillShieldLockFill className='icon' />
                <input type='password' id='contraseña' placeholder='Ingrese su contraseña'
                  onChange={(event) => {
                    setContraseña(event.target.value)
                  }} />
              </div>
            </div>

            <button type='submit' className='btn flex' onClick={crearUsuario}>
              <span>Register</span>
              <AiOutlineSwapRight className='icon' />
            </button>

            <span className='forgotPassword'>
              Forgot your Password <a href=''>Click Here</a>
            </span>
          </form>
        </div>
      </div>
    </div>
    //fin viejo codigo
  );
};

export default Register;