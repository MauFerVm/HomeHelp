import React, { useState } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import video from '../../assets/video.mp4';
import logo from '../../assets/logo.png';
import { FaUserShield } from 'react-icons/fa';
import { BsFillShieldLockFill } from 'react-icons/bs';
import { AiOutlineSwapRight } from 'react-icons/ai';

const Login = () => {
  const [loginUserName, setLoginUserName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const loginUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', {
        LoginUserName: loginUserName,
        LoginPassword: loginPassword,
      });
      
      // Guardar el rol del usuario en localStorage
      if (res.data && res.data.rol) {
        localStorage.setItem('userType', res.data.rol);
        console.log('Usuario autenticado con rol:', res.data.rol);
      } else {
        console.warn('No se recibió el rol del usuario del servidor');
        // Por defecto, asignar rol de cliente si no se recibe
        localStorage.setItem('userType', 'cliente');
      }
      
      // Login exitoso, navegar a dashboard
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMsg('Usuario o contraseña incorrectos');
      } else {
        setErrorMsg('Error del servidor, intente más tarde');
      }
      console.error('Login error:', err);
    }
  };

  return (
    <div className='loginPage flex'>
      <div className='container flex'>
        <div className='videoDiv'>
          <video src={video} autoPlay muted loop></video>
          <div className='textDiv'>
            <h2 className='title'>Conecta con profesional del hogar de todos los rubros</h2>
            <p>Vive la tranquilidad del hogar</p>
          </div>
          <div className='footerDiv flex'>
            <span className='text'>¿No tienes una cuenta?</span>
            <Link to={'/registro'}>
              <button className='btn'>Regístrate</button>
            </Link>
            
          </div>
        </div>

        <div className='formDiv flex'>
          <div className='headerDiv'>
            <img src={logo} alt='Logo' />
            <h3>¡Bienvenido!</h3>
          </div>

          {/* Mensaje de error */}
          {errorMsg && <div className='showMessage'>{errorMsg}</div>}

          <form className='form grid' onSubmit={loginUser}>
            <div className='inputDiv'>
              <label htmlFor='username'>Nombre de Usuario</label>
              <div className='input flex'>
                <FaUserShield className='icon' />
                <input
                  type='text'
                  id='username'
                  placeholder='Enter username'
                  value={loginUserName}
                  onChange={(e) => setLoginUserName(e.target.value)}
                />
              </div>
            </div>

            <div className='inputDiv'>
              <label htmlFor='password'>Contraseña</label>
              <div className='input flex'>
                <BsFillShieldLockFill className='icon' />
                <input
                  type='password'
                  id='password'
                  placeholder='Enter password'
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button type='submit' className='btn flex'>
              <span>Login</span>
              <AiOutlineSwapRight className='icon' />
            </button>

            <span className='forgotPassword'>
              ¿Olvidó su contraseña? <a href=''>Haga clic aquí</a>

            </span>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
