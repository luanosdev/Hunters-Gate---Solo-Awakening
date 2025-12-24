
import { useEffect, useRef } from 'react';
import { Player, GameWorld } from '../types';

export const useGameInput = (worldRef: React.MutableRefObject<GameWorld>) => {
    const inputsRef = useRef({
        up: false, down: false, left: false, right: false,
        attack: false, dodge: false, pickup: false, mouseX: 0, mouseY: 0, inventoryToggle: false
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.code === 'KeyW') inputsRef.current.up = true;
          if (e.code === 'KeyS') inputsRef.current.down = true;
          if (e.code === 'KeyA') inputsRef.current.left = true;
          if (e.code === 'KeyD') inputsRef.current.right = true;
          if (e.code === 'Space') inputsRef.current.dodge = true;
          if (e.code === 'KeyF') inputsRef.current.pickup = true;
          if (e.code === 'Tab') { 
              e.preventDefault(); 
              const p = worldRef.current.player; 
              p.inventoryOpen = !p.inventoryOpen; 
          }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
          if (e.code === 'KeyW') inputsRef.current.up = false;
          if (e.code === 'KeyS') inputsRef.current.down = false;
          if (e.code === 'KeyA') inputsRef.current.left = false;
          if (e.code === 'KeyD') inputsRef.current.right = false;
          if (e.code === 'Space') inputsRef.current.dodge = false;
          if (e.code === 'KeyF') inputsRef.current.pickup = false;
        };
        const handleMouseMove = (e: MouseEvent) => { 
            inputsRef.current.mouseX = e.clientX; 
            inputsRef.current.mouseY = e.clientY; 
        };
        const handleMouseDown = () => { inputsRef.current.attack = true; };
        const handleMouseUp = () => { inputsRef.current.attack = false; };
    
        window.addEventListener('keydown', handleKeyDown); 
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove); 
        window.addEventListener('mousedown', handleMouseDown); 
        window.addEventListener('mouseup', handleMouseUp);
        
        return () => { 
            window.removeEventListener('keydown', handleKeyDown); 
            window.removeEventListener('keyup', handleKeyUp); 
            window.removeEventListener('mousemove', handleMouseMove); 
            window.removeEventListener('mousedown', handleMouseDown); 
            window.removeEventListener('mouseup', handleMouseUp); 
        };
      }, []);

      return inputsRef;
};
