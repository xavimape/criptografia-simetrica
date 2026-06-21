#!/usr/bin/env python3
"""
AES Educational Visualizer
Interactive visualization tool for the Advanced Encryption Standard (AES)
Supports AES-128, AES-192, and AES-256
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import random
import json
from typing import List, Tuple
import os

# Load translations (optional file `translations.json` in same folder)
DEFAULT_LANG = 'en'
try:
    with open(os.path.join(os.path.dirname(__file__), 'translations.json'), 'r', encoding='utf-8') as f:
        TRANSLATIONS = json.load(f)
except Exception:
    TRANSLATIONS = {
        'en': {
            'title': 'AES Visualizer', 'tab_main': 'Main', 'tab_detail': 'Detail', 'tab_compare': 'Compare', 'tab_edu': 'Educational',
            'input_frame': 'Inputs', 'key_label': 'Key', 'random': 'Random', 'key_size_label': 'Key Size', 'plaintext_label': 'Plaintext',
            'input_mode_hex': 'Hex', 'input_mode_text': 'Text', 'exec_control': 'Execution', 'start_encryption': 'Start', 'reset': 'Reset',
            'mode_label': 'Mode', 'mode_step': 'Step', 'mode_auto': 'Auto', 'mode_fast': 'Fast', 'speed_label': 'Speed', 'visualization': 'Visualization',
            'show_binary': 'Show binary', 'highlight_changes': 'Highlight changes', 'show_explanations': 'Show explanations', 'copy_ciphertext': 'Copy Ciphertext',
            'export_json': 'Export JSON', 'nav_first': 'First', 'nav_prev': 'Previous', 'nav_next': 'Next', 'nav_last': 'Last',
            'step_count': 'Step {current}/{total}', 'compare_header': 'Comparison', 'comparison_button': 'Compare',
            'compare_frame_title': 'Compare Two Executions', 'execution1_label': 'Execution 1 - Key:', 'execution2_label': 'Execution 2 - Key:',
            'plaintext_label_short': 'Plaintext:', 'text_mode_title': 'Text Mode', 'text_mode_msg': 'Text is encoded as UTF-8 and padded or truncated to 16 bytes.',
            'error_key_len': 'Key must be {expected} hex chars for AES-{size}', 'error_plain_len': 'Plaintext must be 32 hex chars',
            'error_encryption_failed': 'Encryption failed: {err}', 'fast_mode_header': 'Fast Mode Results',
            'algorithm_label': 'Algorithm', 'rounds_label': 'Rounds', 'key_display': 'Key', 'plaintext_display': 'Plaintext',
            'ciphertext_display': 'Ciphertext', 'total_steps_label': 'Total Steps', 'subbytes': 'SubBytes substitutes each byte using the AES S-box.',
            'shiftrows': 'ShiftRows rotates each row to spread bytes across columns.', 'mixcolumns': 'MixColumns mixes each column in GF(2^8) to increase diffusion.',
            'addroundkey': 'AddRoundKey XORs the state with the current round key.'
        }
    }

# AES S-box (256 bytes)
SBOX = [
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
]

# Round constants for key expansion
RCON = [
    0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36
]

# ============================================================================
# Utility Functions
# ============================================================================

def hex_to_bytes(hex_str: str) -> List[int]:
    """Convert hex string to list of bytes"""
    hex_str = hex_str.replace(" ", "").replace("0x", "")
    return [int(hex_str[i:i+2], 16) for i in range(0, len(hex_str), 2)]

def bytes_to_hex(bytes_list: List[int]) -> str:
    """Convert list of bytes to hex string"""
    return ''.join(f'{b:02x}' for b in bytes_list)

def text_to_hex(text: str) -> str:
    """Convert text to hex string"""
    return text.encode('utf-8').hex()

def text_to_block_hex(text: str, block_size: int = 16) -> str:
    """Convert text to a fixed-size hex block using UTF-8 bytes.

    Text shorter than the AES block is padded with spaces. Longer text is
    truncated to the first block_size bytes so the cipher always receives
    exactly one block.
    """
    data = text.encode('utf-8')
    if len(data) >= block_size:
        data = data[:block_size]
    else:
        data = data.ljust(block_size, b' ')
    return data.hex()

def matrix_to_string(matrix: List[List[int]], binary: bool = False) -> str:
    """Convert state matrix to formatted string"""
    if binary:
        lines = []
        for row in matrix:
            line = ' '.join(f'{b:08b}' for b in row)
            lines.append(line)
        return '\n'.join(lines)
    else:
        lines = []
        for row in matrix:
            line = ' '.join(f'{b:02x}' for b in row)
            lines.append(line)
        return '\n'.join(lines)

def copy_matrix(matrix: List[List[int]]) -> List[List[int]]:
    """Deep copy of matrix"""
    return [row[:] for row in matrix]

def xor_bytes(a: int, b: int) -> int:
    """XOR two bytes"""
    return a ^ b

def gmul(a: int, b: int) -> int:
    """Galois Field multiplication for AES MixColumns"""
    p = 0
    for _ in range(8):
        if b & 1:
            p ^= a
        hi_bit_set = a & 0x80
        a <<= 1
        if hi_bit_set:
            a ^= 0x1b  # AES irreducible polynomial
        b >>= 1
    return p & 0xff

# ============================================================================
# AES Cryptographic Engine
# ============================================================================

class AES:
    """AES encryption engine with step recording for visualization"""
    
    def __init__(self):
        self.state = [[0]*4 for _ in range(4)]
        self.key = []
        self.key_schedule = []
        self.all_steps = []
        self.nr = 0  # Number of rounds
        self.nk = 0  # Key length in 32-bit words
        
    def initialize(self, key_hex: str):
        """Initialize AES with key and perform key expansion"""
        self.key = hex_to_bytes(key_hex)
        key_bits = len(self.key) * 8
        
        if key_bits == 128:
            self.nk = 4
            self.nr = 10
        elif key_bits == 192:
            self.nk = 6
            self.nr = 12
        elif key_bits == 256:
            self.nk = 8
            self.nr = 14
        else:
            raise ValueError(f"Invalid key size: {key_bits} bits. Must be 128, 192, or 256.")
        
        self.all_steps = []
        self.key_expansion()
        
    def key_expansion(self):
        """Expand the key into round keys"""
        self.key_schedule = []
        
        # Copy initial key
        w = []
        for i in range(self.nk):
            w.append([self.key[4*i], self.key[4*i+1], self.key[4*i+2], self.key[4*i+3]])
        
        # Expand key
        for i in range(self.nk, 4 * (self.nr + 1)):
            temp = w[i-1][:]
            
            if i % self.nk == 0:
                # RotWord
                temp = temp[1:] + temp[:1]
                # SubWord
                temp = [SBOX[b] for b in temp]
                # XOR with Rcon
                temp[0] ^= RCON[(i // self.nk) - 1]
            elif self.nk > 6 and i % self.nk == 4:
                # SubWord for AES-256
                temp = [SBOX[b] for b in temp]
            
            new_word = [w[i-self.nk][j] ^ temp[j] for j in range(4)]
            w.append(new_word)
        
        # Convert to round keys (4x4 matrices)
        for round_num in range(self.nr + 1):
            round_key = [[0]*4 for _ in range(4)]
            for col in range(4):
                word = w[round_num * 4 + col]
                for row in range(4):
                    round_key[row][col] = word[row]
            self.key_schedule.append(round_key)
    
    def encrypt(self, plaintext_hex: str) -> str:
        """Encrypt plaintext and record all steps"""
        plaintext = hex_to_bytes(plaintext_hex)
        
        if len(plaintext) != 16:
            raise ValueError("Plaintext must be exactly 16 bytes (128 bits)")
        
        # Initialize state matrix
        for col in range(4):
            for row in range(4):
                self.state[row][col] = plaintext[col * 4 + row]
        
        self.all_steps = []
        
        # Record initial state
        self.record_step('Initial State', -1, copy_matrix(self.state), 
                        copy_matrix(self.state), [], self.key_schedule[0])
        
        # Initial round - AddRoundKey
        state_before = copy_matrix(self.state)
        self.add_round_key(0)
        self.record_step('AddRoundKey', 0, state_before, 
                        copy_matrix(self.state), self.find_changes(state_before, self.state),
                        self.key_schedule[0])
        
        # Main rounds
        for round_num in range(1, self.nr):
            # SubBytes
            state_before = copy_matrix(self.state)
            self.sub_bytes()
            self.record_step('SubBytes', round_num, state_before,
                           copy_matrix(self.state), self.find_changes(state_before, self.state),
                           self.key_schedule[round_num])
            
            # ShiftRows
            state_before = copy_matrix(self.state)
            self.shift_rows()
            self.record_step('ShiftRows', round_num, state_before,
                           copy_matrix(self.state), self.find_changes(state_before, self.state),
                           self.key_schedule[round_num])
            
            # MixColumns
            state_before = copy_matrix(self.state)
            self.mix_columns()
            self.record_step('MixColumns', round_num, state_before,
                           copy_matrix(self.state), self.find_changes(state_before, self.state),
                           self.key_schedule[round_num])
            
            # AddRoundKey
            state_before = copy_matrix(self.state)
            self.add_round_key(round_num)
            self.record_step('AddRoundKey', round_num, state_before,
                           copy_matrix(self.state), self.find_changes(state_before, self.state),
                           self.key_schedule[round_num])
        
        # Final round (no MixColumns)
        # SubBytes
        state_before = copy_matrix(self.state)
        self.sub_bytes()
        self.record_step('SubBytes', self.nr, state_before,
                       copy_matrix(self.state), self.find_changes(state_before, self.state),
                       self.key_schedule[self.nr])
        
        # ShiftRows
        state_before = copy_matrix(self.state)
        self.shift_rows()
        self.record_step('ShiftRows', self.nr, state_before,
                       copy_matrix(self.state), self.find_changes(state_before, self.state),
                       self.key_schedule[self.nr])
        
        # AddRoundKey
        state_before = copy_matrix(self.state)
        self.add_round_key(self.nr)
        self.record_step('AddRoundKey', self.nr, state_before,
                       copy_matrix(self.state), self.find_changes(state_before, self.state),
                       self.key_schedule[self.nr])
        
        # Convert state to ciphertext
        ciphertext = []
        for col in range(4):
            for row in range(4):
                ciphertext.append(self.state[row][col])
        
        return bytes_to_hex(ciphertext)
    
    def sub_bytes(self):
        """Apply S-box substitution to state"""
        for i in range(4):
            for j in range(4):
                self.state[i][j] = SBOX[self.state[i][j]]
    
    def shift_rows(self):
        """Shift rows of state"""
        # Row 0: no shift
        # Row 1: shift left by 1
        self.state[1] = self.state[1][1:] + self.state[1][:1]
        # Row 2: shift left by 2
        self.state[2] = self.state[2][2:] + self.state[2][:2]
        # Row 3: shift left by 3
        self.state[3] = self.state[3][3:] + self.state[3][:3]
    
    def mix_columns(self):
        """Mix columns of state"""
        for col in range(4):
            column = [self.state[row][col] for row in range(4)]
            
            self.state[0][col] = gmul(column[0], 2) ^ gmul(column[1], 3) ^ column[2] ^ column[3]
            self.state[1][col] = column[0] ^ gmul(column[1], 2) ^ gmul(column[2], 3) ^ column[3]
            self.state[2][col] = column[0] ^ column[1] ^ gmul(column[2], 2) ^ gmul(column[3], 3)
            self.state[3][col] = gmul(column[0], 3) ^ column[1] ^ column[2] ^ gmul(column[3], 2)
    
    def add_round_key(self, round_num: int):
        """XOR state with round key"""
        for i in range(4):
            for j in range(4):
                self.state[i][j] ^= self.key_schedule[round_num][i][j]
    
    def find_changes(self, before: List[List[int]], after: List[List[int]]) -> List[Tuple[int, int]]:
        """Find positions where state changed"""
        changes = []
        for i in range(4):
            for j in range(4):
                if before[i][j] != after[i][j]:
                    changes.append((i, j))
        return changes
    
    def record_step(self, phase: str, round_num: int, state_before: List[List[int]], 
                   state_after: List[List[int]], changes: List[Tuple[int, int]], 
                   round_key: List[List[int]]):
        """Record a step for visualization"""
        step = {
            'phase': phase,
            'round_num': round_num,
            'state_before': copy_matrix(state_before),
            'state_after': copy_matrix(state_after),
            'changes': changes[:],
            'round_key': copy_matrix(round_key)
        }
        self.all_steps.append(step)

# ============================================================================
# GUI Visualizer
# ============================================================================

class AESVisualizerAdvanced:
    """Advanced AES visualizer with multiple tabs and features"""
    
    def __init__(self, root):
        self.root = root
        # current language
        self.lang = DEFAULT_LANG
        self.root.title(self.tr('title') if hasattr(self, 'tr') else TRANSLATIONS[self.lang]['title'])
        self.root.geometry("1200x800")
        
        self.aes = AES()
        self.current_step = 0
        self.execution_mode = "step"  # step, auto, fast
        self.animation_speed = 1.0
        self.show_binary = False
        self.highlight_changes = True
        self.show_explanations = True
        self.auto_running = False
        
        self.setup_ui()

    def tr(self, key: str, **kwargs) -> str:
        """Translate a key for the current language"""
        txt = TRANSLATIONS.get(self.lang, {}).get(key)
        if txt is None:
            # fallback to English or key itself
            txt = TRANSLATIONS.get('en', {}).get(key, key)
        try:
            return txt.format(**kwargs)
        except Exception:
            return txt

    def rebuild_ui(self):
        """Destroy and recreate the UI (used when language changes)."""
        for child in self.root.winfo_children():
            child.destroy()
        self.setup_ui()

    def set_language(self, lang_code: str):
        """Set active language and rebuild UI."""
        if lang_code not in TRANSLATIONS:
            return
        self.lang = lang_code
        self.rebuild_ui()

    def on_language_change(self, selection_display_name: str):
        """Callback from OptionMenu; map display name to code and set language."""
        # simple mapping
        display_map = {TRANSLATIONS[c].get('lang_display', ('Español' if c=='es' else 'English')): c for c in TRANSLATIONS}
        lang_code = display_map.get(selection_display_name, selection_display_name)
        self.set_language(lang_code)
        
    def setup_ui(self):
        """Setup main UI with tabs"""
        # Window title (update on language change)
        try:
            self.root.title(self.tr('title'))
        except Exception:
            self.root.title(TRANSLATIONS.get(self.lang, {}).get('title', 'AES Visualizer'))
        # Language selector at top-right (populate from translations file if present)
        lang_frame = ttk.Frame(self.root)
        lang_frame.pack(fill='x')
        # Build display map from loaded translations (supports user-provided file)
        lang_display = {code: TRANSLATIONS.get(code, {}).get('lang_display', ('Español' if code == 'es' else 'English')) for code in TRANSLATIONS}
        display_values = list(lang_display.values())
        self.lang_var = tk.StringVar(value=lang_display.get(self.lang, display_values[0] if display_values else 'Español'))
        ttk.Label(lang_frame, text='').pack(side='left', expand=True)
        tk.OptionMenu(lang_frame, self.lang_var, *display_values, command=self.on_language_change).pack(side='right', padx=6, pady=6)

        # Create notebook (tabs)
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill='both', expand=True, padx=5, pady=5)
        
        # Create tabs
        self.main_tab = ttk.Frame(self.notebook)
        self.detail_tab = ttk.Frame(self.notebook)
        self.compare_tab = ttk.Frame(self.notebook)
        self.edu_tab = ttk.Frame(self.notebook)
        
        self.notebook.add(self.main_tab, text=self.tr('tab_main'))
        self.notebook.add(self.detail_tab, text=self.tr('tab_detail'))
        self.notebook.add(self.compare_tab, text=self.tr('tab_compare'))
        self.notebook.add(self.edu_tab, text=self.tr('tab_edu'))
        
        # Setup each tab
        self.setup_main_tab()
        self.setup_detail_tab()
        self.setup_compare_tab()
        self.setup_edu_tab()
    
    def setup_main_tab(self):
        """Setup main execution tab"""
        # Input frame
        input_frame = ttk.LabelFrame(self.main_tab, text=self.tr('input_frame'), padding=10)
        input_frame.pack(fill='x', padx=5, pady=5)
        
        # Key input
        ttk.Label(input_frame, text=self.tr('key_label')).grid(row=0, column=0, sticky='w', pady=2)
        self.key_entry = ttk.Entry(input_frame, width=70)
        self.key_entry.grid(row=0, column=1, padx=5, pady=2)
        self.key_entry.insert(0, "000102030405060708090a0b0c0d0e0f")
        
        ttk.Button(input_frame, text=self.tr('random'), command=self.generate_random_key).grid(row=0, column=2, padx=2)
        
        # Key size selection
        ttk.Label(input_frame, text=self.tr('key_size_label')).grid(row=1, column=0, sticky='w', pady=2)
        self.key_size_var = tk.StringVar(value="128")
        key_size_frame = ttk.Frame(input_frame)
        key_size_frame.grid(row=1, column=1, sticky='w', pady=2)
        ttk.Radiobutton(key_size_frame, text="AES-128", variable=self.key_size_var, 
                       value="128").pack(side='left', padx=5)
        ttk.Radiobutton(key_size_frame, text="AES-192", variable=self.key_size_var, 
                       value="192").pack(side='left', padx=5)
        ttk.Radiobutton(key_size_frame, text="AES-256", variable=self.key_size_var, 
                       value="256").pack(side='left', padx=5)
        
        # Plaintext input
        ttk.Label(input_frame, text=self.tr('plaintext_label')).grid(row=2, column=0, sticky='w', pady=2)
        self.plaintext_entry = ttk.Entry(input_frame, width=70)
        self.plaintext_entry.grid(row=2, column=1, padx=5, pady=2)
        self.plaintext_entry.insert(0, "00112233445566778899aabbccddeeff")
        
        ttk.Button(input_frame, text=self.tr('random'), command=self.generate_random_plaintext).grid(row=2, column=2, padx=2)
        
        # Input mode
        self.input_mode_var = tk.StringVar(value="hex")
        input_mode_frame = ttk.Frame(input_frame)
        input_mode_frame.grid(row=3, column=1, sticky='w', pady=2)
        ttk.Radiobutton(input_mode_frame, text=self.tr('input_mode_hex'), variable=self.input_mode_var, 
                       value="hex").pack(side='left', padx=5)
        ttk.Radiobutton(input_mode_frame, text=self.tr('input_mode_text'), variable=self.input_mode_var, 
                   value="text", command=self.convert_text_mode).pack(side='left', padx=5)
        
        # Control frame
        control_frame = ttk.LabelFrame(self.main_tab, text=self.tr('exec_control'), padding=10)
        control_frame.pack(fill='x', padx=5, pady=5)
        
        ttk.Button(control_frame, text=self.tr('start_encryption'), 
              command=self.start_execution).pack(side='left', padx=5)
        ttk.Button(control_frame, text=self.tr('reset'), 
              command=self.reset_execution).pack(side='left', padx=5)
        
        # Execution mode
        ttk.Label(control_frame, text=self.tr('mode_label')).pack(side='left', padx=5)
        self.exec_mode_var = tk.StringVar(value="step")
        ttk.Radiobutton(control_frame, text=self.tr('mode_step'), variable=self.exec_mode_var, 
                       value="step").pack(side='left', padx=2)
        ttk.Radiobutton(control_frame, text=self.tr('mode_auto'), variable=self.exec_mode_var, 
                       value="auto").pack(side='left', padx=2)
        ttk.Radiobutton(control_frame, text=self.tr('mode_fast'), variable=self.exec_mode_var, 
                       value="fast").pack(side='left', padx=2)
        
        # Speed control
        ttk.Label(control_frame, text=self.tr('speed_label')).pack(side='left', padx=5)
        self.speed_var = tk.DoubleVar(value=1.0)
        speed_scale = ttk.Scale(control_frame, from_=0.1, to=3.0, variable=self.speed_var, 
                               orient='horizontal', length=100)
        speed_scale.pack(side='left', padx=2)
        self.speed_label = ttk.Label(control_frame, text="1.0x")
        self.speed_label.pack(side='left', padx=2)
        speed_scale.configure(command=self.update_speed_label)
        
        # Visualization frame
        viz_frame = ttk.LabelFrame(self.main_tab, text=self.tr('visualization'), padding=10)
        viz_frame.pack(fill='both', expand=True, padx=5, pady=5)
        
        # Output text
        self.output_text = scrolledtext.ScrolledText(viz_frame, wrap=tk.WORD, 
                                                     height=25, font=('Courier New', 10))
        self.output_text.pack(fill='both', expand=True)
        
        # Options frame
        options_frame = ttk.Frame(self.main_tab)
        options_frame.pack(fill='x', padx=5, pady=5)
        
        self.binary_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(options_frame, text=self.tr('show_binary'), 
                   variable=self.binary_var).pack(side='left', padx=5)
        
        self.highlight_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(options_frame, text=self.tr('highlight_changes'), 
                   variable=self.highlight_var).pack(side='left', padx=5)
        
        self.explain_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(options_frame, text=self.tr('show_explanations'), 
                   variable=self.explain_var).pack(side='left', padx=5)
        
        ttk.Button(options_frame, text=self.tr('copy_ciphertext'), 
              command=self.copy_ciphertext).pack(side='right', padx=5)
        ttk.Button(options_frame, text=self.tr('export_json'), 
              command=self.export_json).pack(side='right', padx=5)
    
    def setup_detail_tab(self):
        """Setup detailed view tab"""
        # Navigation frame
        nav_frame = ttk.Frame(self.detail_tab)
        nav_frame.pack(fill='x', padx=5, pady=5)
        
        ttk.Button(nav_frame, text=self.tr('nav_first'), 
                  command=self.goto_first_step).pack(side='left', padx=2)
        ttk.Button(nav_frame, text=self.tr('nav_prev'), 
                  command=self.goto_prev_step).pack(side='left', padx=2)
        ttk.Button(nav_frame, text=self.tr('nav_next'), 
                  command=self.goto_next_step).pack(side='left', padx=2)
        ttk.Button(nav_frame, text=self.tr('nav_last'), 
                  command=self.goto_last_step).pack(side='left', padx=2)
        
        self.step_label = ttk.Label(nav_frame, text=self.tr('step_count', current=0, total=0))
        self.step_label.pack(side='left', padx=10)
        
        # Detail display
        self.detail_text = scrolledtext.ScrolledText(self.detail_tab, wrap=tk.WORD, 
                                                     height=35, font=('Courier New', 10))
        self.detail_text.pack(fill='both', expand=True, padx=5, pady=5)
    
    def setup_compare_tab(self):
        """Setup comparison mode tab"""
        ttk.Label(self.compare_tab, text=self.tr('compare_header'), 
             font=('Arial', 16, 'bold')).pack(pady=10)
        
        # Input frame for comparison
        comp_frame = ttk.LabelFrame(self.compare_tab, text=self.tr('compare_frame_title'), padding=10)
        comp_frame.pack(fill='x', padx=5, pady=5)
        
        # First execution
        ttk.Label(comp_frame, text=self.tr('execution1_label')).grid(row=0, column=0, sticky='w', pady=2)
        self.comp_key1 = ttk.Entry(comp_frame, width=50)
        self.comp_key1.grid(row=0, column=1, padx=5, pady=2)
        self.comp_key1.insert(0, "000102030405060708090a0b0c0d0e0f")
        
        ttk.Label(comp_frame, text=self.tr('plaintext_label_short')).grid(row=1, column=0, sticky='w', pady=2)
        self.comp_plain1 = ttk.Entry(comp_frame, width=50)
        self.comp_plain1.grid(row=1, column=1, padx=5, pady=2)
        self.comp_plain1.insert(0, "00112233445566778899aabbccddeeff")
        
        # Second execution
        ttk.Label(comp_frame, text=self.tr('execution2_label')).grid(row=2, column=0, sticky='w', pady=2)
        self.comp_key2 = ttk.Entry(comp_frame, width=50)
        self.comp_key2.grid(row=2, column=1, padx=5, pady=2)
        self.comp_key2.insert(0, "000102030405060708090a0b0c0d0e10")  # 1 bit different
        
        ttk.Label(comp_frame, text=self.tr('plaintext_label_short')).grid(row=3, column=0, sticky='w', pady=2)
        self.comp_plain2 = ttk.Entry(comp_frame, width=50)
        self.comp_plain2.grid(row=3, column=1, padx=5, pady=2)
        self.comp_plain2.insert(0, "00112233445566778899aabbccddeeff")
        
        ttk.Button(comp_frame, text=self.tr('comparison_button'), 
              command=self.compare_executions).grid(row=4, column=1, pady=10)
        
        # Comparison results
        self.compare_text = scrolledtext.ScrolledText(self.compare_tab, wrap=tk.WORD, 
                                                      height=25, font=('Courier New', 10))
        self.compare_text.pack(fill='both', expand=True, padx=5, pady=5)
    
    def setup_edu_tab(self):
        """Setup educational guide tab"""
        edu_text = scrolledtext.ScrolledText(self.edu_tab, wrap=tk.WORD, 
                                            font=('Arial', 11))
        edu_text.pack(fill='both', expand=True, padx=10, pady=10)
        
        educational_content = """
AES EDUCATIONAL GUIDE
=====================

1. INTRODUCTION TO AES
----------------------
The Advanced Encryption Standard (AES) is a symmetric block cipher that encrypts data 
in fixed-size blocks of 128 bits (16 bytes). It supports three key sizes:
- AES-128: 128-bit key, 10 rounds
- AES-192: 192-bit key, 12 rounds
- AES-256: 256-bit key, 14 rounds

2. STATE REPRESENTATION
-----------------------
AES operates on a 4x4 matrix of bytes called the "state":

    [s00 s01 s02 s03]
    [s10 s11 s12 s13]
    [s20 s21 s22 s23]
    [s30 s31 s32 s33]

Input bytes are arranged in column-major order.

3. AES TRANSFORMATIONS
----------------------

A. SubBytes (Byte Substitution)
   - Applies S-box (substitution box) to each byte
   - Non-linear transformation providing confusion
   - Each byte replaced with corresponding S-box value
   - Example: 0x00 → 0x63, 0x01 → 0x7c

B. ShiftRows (Row Shifting)
   - Rotates rows cyclically:
     Row 0: no shift
     Row 1: shift left by 1 byte
     Row 2: shift left by 2 bytes
     Row 3: shift left by 3 bytes
   - Provides diffusion across columns

C. MixColumns (Column Mixing)
   - Multiplies each column by fixed matrix in GF(2^8)
   - Provides diffusion within columns
   - Skipped in final round
   - Each byte in column affects all bytes in output column

D. AddRoundKey (Key Addition)
   - XORs state with round key
   - Only step using key material
   - Performed in every round including initial and final

4. KEY SCHEDULE (KEY EXPANSION)
-------------------------------
The original key is expanded into separate round keys:
- AES-128: 11 round keys (10 rounds + 1 initial)
- AES-192: 13 round keys
- AES-256: 15 round keys

Key expansion uses:
- RotWord: circular left shift
- SubWord: S-box application
- Rcon: round constant XOR

5. ENCRYPTION PROCESS
---------------------
Initial Round:
  1. AddRoundKey (with key schedule[0])

Main Rounds (9, 11, or 13 depending on key size):
  1. SubBytes
  2. ShiftRows
  3. MixColumns
  4. AddRoundKey

Final Round:
  1. SubBytes
  2. ShiftRows
  3. AddRoundKey (no MixColumns)

6. SECURITY PROPERTIES
----------------------
- Confusion: SubBytes makes relationship between key and ciphertext complex
- Diffusion: ShiftRows and MixColumns spread influence of input bits
- Avalanche Effect: Small input change causes large output change
- Non-linearity: Prevents linear cryptanalysis

7. GALOIS FIELD ARITHMETIC
--------------------------
MixColumns uses multiplication in GF(2^8):
- Irreducible polynomial: x^8 + x^4 + x^3 + x + 1 (0x11b)
- Multiplication: polynomial multiplication mod irreducible polynomial
- Used for: 0x02 and 0x03 multiplications in MixColumns matrix

8. PRACTICAL APPLICATIONS
-------------------------
- File encryption
- Disk encryption (BitLocker, FileVault)
- Network security (TLS/SSL, VPN)
- Wireless security (WPA2, WPA3)
- Database encryption

9. USING THIS VISUALIZER
------------------------
Main Execution Tab:
- Enter key and plaintext in hexadecimal
- Choose AES-128, 192, or 256
- Select execution mode (step-by-step, auto, or fast)
- Watch the encryption process with visual feedback

Detailed View Tab:
- Navigate through each transformation step
- See state changes highlighted
- View round keys used at each step

Comparison Mode:
- Compare two different encryptions
- Observe avalanche effect
- Analyze how small changes propagate

10. TEST VECTORS (NIST FIPS-197)
--------------------------------
AES-128 Example:
Key:       000102030405060708090a0b0c0d0e0f
Plaintext: 00112233445566778899aabbccddeeff
Ciphertext: 69c4e0d86a7b0430d8cdb78070b4c55a

Try this example to verify the implementation!

11. LEARNING EXERCISES
----------------------
1. Run encryption with example vectors and verify output
2. Change one bit in key - observe avalanche effect
3. Compare AES-128 vs AES-256 - count rounds
4. Watch how bytes move in ShiftRows
5. Observe diffusion in MixColumns
6. Track a single byte through all transformations

For more information, consult:
- NIST FIPS-197 (Official AES Specification)
- "The Design of Rijndael" by Daemen and Rijmen
"""
        
        edu_text.insert('1.0', educational_content)
        edu_text.configure(state='disabled')
    
    def generate_random_key(self):
        """Generate random key based on selected size"""
        key_size = int(self.key_size_var.get())
        key_bytes = key_size // 8
        random_key = ''.join(f'{random.randint(0, 255):02x}' for _ in range(key_bytes))
        self.key_entry.delete(0, tk.END)
        self.key_entry.insert(0, random_key)
    
    def generate_random_plaintext(self):
        """Generate random plaintext (always 128 bits)"""
        random_plain = ''.join(f'{random.randint(0, 255):02x}' for _ in range(16))
        self.plaintext_entry.delete(0, tk.END)
        self.plaintext_entry.insert(0, random_plain)
    
    def convert_text_mode(self):
        """Convert between text and hex mode"""
        if self.input_mode_var.get() == "text":
            messagebox.showinfo(self.tr('text_mode_title'), self.tr('text_mode_msg'))
    
    def update_speed_label(self, value):
        """Update speed label"""
        self.speed_label.configure(text=f"{float(value):.1f}x")
        self.animation_speed = float(value)
    
    def start_execution(self):
        """Start encryption execution"""
        try:
            # Get inputs
            key_hex = self.key_entry.get().replace(" ", "")
            plaintext_input = self.plaintext_entry.get().replace(" ", "")
            
            # Convert text to hex if needed
            if self.input_mode_var.get() == "text":
                plaintext_hex = text_to_block_hex(plaintext_input)
            else:
                plaintext_hex = plaintext_input
            
            # Validate key size
            key_size = int(self.key_size_var.get())
            expected_key_len = key_size // 4  # hex characters
            if len(key_hex) != expected_key_len:
                messagebox.showerror("Error", self.tr('error_key_len', expected=expected_key_len, size=key_size))
                return
            
            # Validate plaintext
            if len(plaintext_hex) != 32:
                messagebox.showerror("Error", self.tr('error_plain_len'))
                return
            
            # Initialize and encrypt
            self.aes.initialize(key_hex)
            ciphertext = self.aes.encrypt(plaintext_hex)
            
            # Display results
            self.current_step = 0
            execution_mode = self.exec_mode_var.get()
            
            if execution_mode == "fast":
                self.display_fast_results(key_hex, plaintext_hex, ciphertext)
            elif execution_mode == "auto":
                self.display_auto_execution()
            else:
                self.display_step_execution()
                
        except Exception as e:
            messagebox.showerror("Error", self.tr('error_encryption_failed', err=str(e)))
    
    def display_fast_results(self, key_hex, plaintext_hex, ciphertext):
        """Display final results without animation"""
        self.output_text.delete('1.0', tk.END)
        output = "═" * 80 + "\n"
        output += self.tr('fast_mode_header') + "\n"
        output += "═" * 80 + "\n\n"
        output += f"{self.tr('algorithm_label')}: AES-{self.key_size_var.get()}\n"
        output += f"{self.tr('rounds_label')}: {self.aes.nr}\n\n"
        output += f"{self.tr('key_display')}:        {key_hex}\n"
        output += f"{self.tr('plaintext_display')}:  {plaintext_hex}\n"
        output += f"{self.tr('ciphertext_display')}: {ciphertext}\n\n"
        output += f"{self.tr('total_steps_label')}: {len(self.aes.all_steps)}\n"
        output += "═" * 80 + "\n"
        
        self.output_text.insert('1.0', output)
        
        # Also update detail tab
        self.update_detail_view()
    
    def display_auto_execution(self):
        """Display execution with automatic step progression"""
        self.auto_running = True
        self.current_step = 0
        self.output_text.delete('1.0', tk.END)
        self.next_auto_step()
    
    def next_auto_step(self):
        """Progress to next step in auto mode"""
        if not self.auto_running or self.current_step >= len(self.aes.all_steps):
            self.auto_running = False
            return
        
        self.display_current_step()
        self.current_step += 1
        
        delay = int(1000 / self.animation_speed)
        self.root.after(delay, self.next_auto_step)
    
    def display_step_execution(self):
        """Display first step in step-by-step mode"""
        self.current_step = 0
        self.display_current_step()
        self.update_detail_view()
    
    def display_current_step(self):
        """Display current encryption step"""
        if self.current_step >= len(self.aes.all_steps):
            return
        
        step = self.aes.all_steps[self.current_step]
        
        self.output_text.delete('1.0', tk.END)
        
        output = "═" * 80 + "\n"
        if step['round_num'] == -1:
            output += self.tr('initial_state_header') + "\n"
        elif step['round_num'] == 0:
            output += self.tr('initial_round_header', phase=step['phase']) + "\n"
        elif step['round_num'] == self.aes.nr:
            output += self.tr('final_round_header', round=step['round_num'], phase=step['phase']) + "\n"
        else:
            output += self.tr('round_header', round=step['round_num'], phase=step['phase']) + "\n"
        output += "═" * 80 + "\n\n"
        
        # Show explanation if enabled
        if self.explain_var.get():
            output += self.get_step_explanation(step['phase']) + "\n\n"
        
        # Show state before
        output += self.tr('state_before') + "\n"
        output += self.format_matrix(step['state_before'], step['changes'] if self.highlight_var.get() else [])
        output += "\n"
        
        # Show transformation arrow
        output += " " * 35 + "↓\n"
        output += " " * 28 + f"[{step['phase']}]\n"
        output += " " * 35 + "↓\n\n"
        
        # Show state after
        output += self.tr('state_after') + "\n"
        output += self.format_matrix(step['state_after'], step['changes'] if self.highlight_var.get() else [])
        output += "\n"
        
        # Show round key if AddRoundKey
        if step['phase'] == 'AddRoundKey' or step['round_num'] == -1:
            output += "\n" + self.tr('round_key') + "\n"
            output += self.format_matrix(step['round_key'], [])
            output += "\n"
        
        # Show progress
        output += "\n" + self.tr('step_of', current=self.current_step + 1, total=len(self.aes.all_steps)) + "\n"
        output += "═" * 80 + "\n"
        
        self.output_text.insert('1.0', output)
    
    def format_matrix(self, matrix, changes):
        """Format 4x4 matrix for display"""
        if self.binary_var.get():
            return self.format_matrix_binary(matrix, changes)
        else:
            return self.format_matrix_hex(matrix, changes)
    
    def format_matrix_hex(self, matrix, changes):
        """Format matrix in hexadecimal with proper alignment"""
        output = "┌───────┬───────┬───────┬───────┐\n"
        for i in range(4):
            output += "│"
            for j in range(4):
                if (i, j) in changes and self.highlight_var.get():
                    val = f"*{matrix[i][j]:02x}*"
                else:
                    val = f"{matrix[i][j]:02x}"
                output += f" {val:^5} │"  # center-align in 5 spaces
            output += "\n"
            if i < 3:
                output += "├───────┼───────┼───────┼───────┤\n"
        output += "└───────┴───────┴───────┴───────┘"
        return output


    
    def format_matrix_binary(self, matrix, changes):
        """Format matrix in binary"""
        output = ""
        for i in range(4):
            row = ""
            for j in range(4):
                val = f"{matrix[i][j]:08b}"
                if (i, j) in changes and self.highlight_var.get():
                    val = f"*{val}*"
                row += val + "  "
            output += row + "\n"
        return output
    
    def get_step_explanation(self, phase):
        """Get explanation for transformation"""
        key_map = {
            'Initial State': 'initial_state',
            'SubBytes': 'subbytes',
            'ShiftRows': 'shiftrows',
            'MixColumns': 'mixcolumns',
            'AddRoundKey': 'addroundkey'
        }
        tkey = key_map.get(phase)
        if tkey:
            return self.tr(tkey)
        return ''
    
    def reset_execution(self):
        """Reset execution"""
        self.current_step = 0
        self.auto_running = False
        self.output_text.delete('1.0', tk.END)
        self.detail_text.delete('1.0', tk.END)
        self.aes.all_steps = []
    
    def goto_first_step(self):
        """Go to first step"""
        self.current_step = 0
        self.update_detail_view()
    
    def goto_prev_step(self):
        """Go to previous step"""
        if self.current_step > 0:
            self.current_step -= 1
            self.update_detail_view()
    
    def goto_next_step(self):
        """Go to next step"""
        if self.current_step < len(self.aes.all_steps) - 1:
            self.current_step += 1
            self.update_detail_view()
    
    def goto_last_step(self):
        """Go to last step"""
        if len(self.aes.all_steps) > 0:
            self.current_step = len(self.aes.all_steps) - 1
            self.update_detail_view()
    
    def update_detail_view(self):
        """Update detailed view tab"""
        if len(self.aes.all_steps) == 0:
            return
        
        self.step_label.configure(text=self.tr('step_count', current=self.current_step + 1, total=len(self.aes.all_steps)))
        
        step = self.aes.all_steps[self.current_step]
        
        self.detail_text.delete('1.0', tk.END)
        
        output = "═" * 80 + "\n"
        output += self.tr('detailed_view_header', step=self.current_step + 1) + "\n"
        output += "═" * 80 + "\n\n"
        
        # Step information
        if step['round_num'] == -1:
            output += self.tr('phase_label', phase=self.tr('initial_state')) + "\n"
        else:
            output += self.tr('round_label', round=step['round_num']) + "\n"
            output += self.tr('phase_label', phase=step['phase']) + "\n"
        
        output += self.tr('changes_label', count=len(step['changes'])) + "\n\n"
        
        # Explanation
        output += self.tr('explanation_label') + "\n"
        output += self.get_step_explanation(step['phase']) + "\n\n"
        
        # State before and after
        output += self.tr('state_before') + "\n"
        output += self.format_matrix_hex(step['state_before'], [])
        output += "\n\n"
        
        output += self.tr('state_after') + "\n"
        output += self.format_matrix_hex(step['state_after'], step['changes'])
        output += "\n\n"
        
        # Show changes details
        if len(step['changes']) > 0:
            output += self.tr('changed_positions_label') + "\n"
            for i, j in step['changes']:
                before_val = step['state_before'][i][j]
                after_val = step['state_after'][i][j]
                output += self.tr('changed_positions_item', i=i, j=j, before=before_val, after=after_val) + "\n"
            output += "\n"
        
        # Round key
        if step['phase'] == 'AddRoundKey' or step['round_num'] == -1:
            output += self.tr('round_key') + "\n"
            output += self.format_matrix_hex(step['round_key'], [])
            output += "\n\n"
        
        self.detail_text.insert('1.0', output)
    
    def compare_executions(self):
        """Compare two encryption executions"""
        try:
            # Get inputs
            key1 = self.comp_key1.get().replace(" ", "")
            plain1 = self.comp_plain1.get().replace(" ", "")
            key2 = self.comp_key2.get().replace(" ", "")
            plain2 = self.comp_plain2.get().replace(" ", "")
            
            # Execute both
            aes1 = AES()
            aes1.initialize(key1)
            cipher1 = aes1.encrypt(plain1)
            
            aes2 = AES()
            aes2.initialize(key2)
            cipher2 = aes2.encrypt(plain2)
            
            # Compare
            self.compare_text.delete('1.0', tk.END)
            
            output = "═" * 80 + "\n"
            output += self.tr('comparison_mode_title') + "\n"
            output += "═" * 80 + "\n\n"
            
            output += self.tr('execution_label', n=1) + "\n"
            output += f"{self.tr('key_display')}:        {key1}\n"
            output += f"{self.tr('plaintext_display')}:  {plain1}\n"
            output += f"{self.tr('ciphertext_display')}: {cipher1}\n\n"
            
            output += self.tr('execution_label', n=2) + "\n"
            output += f"{self.tr('key_display')}:        {key2}\n"
            output += f"{self.tr('plaintext_display')}:  {plain2}\n"
            output += f"{self.tr('ciphertext_display')}: {cipher2}\n\n"
            
            # Calculate differences
            key_diff = sum(1 for a, b in zip(key1, key2) if a != b)
            plain_diff = sum(1 for a, b in zip(plain1, plain2) if a != b)
            cipher_diff = sum(1 for a, b in zip(cipher1, cipher2) if a != b)
            
            output += self.tr('differences_label') + "\n"
            output += f"{self.tr('key_display')}:        {key_diff} hex digits different\n"
            output += f"{self.tr('plaintext_display')}:  {plain_diff} hex digits different\n"
            output += f"{self.tr('ciphertext_display')}: {cipher_diff} hex digits different\n\n"
            
            # Avalanche effect
            if key_diff > 0 or plain_diff > 0:
                input_bits_diff = (key_diff + plain_diff) * 4  # 4 bits per hex digit
                output_bits_diff = cipher_diff * 4
                output += "\n" + self.tr('avalanche_effect') + "\n"
                output += self.tr('input_bits_changed', bits=input_bits_diff) + "\n"
                output += self.tr('output_bits_changed', bits=output_bits_diff) + "\n"
                output += self.tr('avalanche_ratio', ratio=(output_bits_diff / input_bits_diff)) + "\n"
                output += self.tr('good_encryption_note') + "\n"
            
            output += "\n" + "═" * 80 + "\n"
            
            self.compare_text.insert('1.0', output)
            
        except Exception as e:
            messagebox.showerror("Error", self.tr('error_comparison_failed', err=str(e)))
    
    def copy_ciphertext(self):
        """Copy ciphertext to clipboard"""
        if len(self.aes.all_steps) > 0:
            last_step = self.aes.all_steps[-1]
            state = last_step['state_after']
            ciphertext = ''
            for col in range(4):
                for row in range(4):
                    ciphertext += f'{state[row][col]:02x}'
            self.root.clipboard_clear()
            self.root.clipboard_append(ciphertext)
            messagebox.showinfo(self.tr('export_title'), self.tr('success_copied'))
    
    def export_json(self):
        """Export execution to JSON"""
        if len(self.aes.all_steps) == 0:
            messagebox.showwarning(self.tr('export_title'), self.tr('warning_no_exec'))
            return
        
        try:
            data = {
                'algorithm': f'AES-{self.key_size_var.get()}',
                'rounds': self.aes.nr,
                'key': self.key_entry.get(),
                'plaintext': self.plaintext_entry.get(),
                'steps': []
            }
            
            for step in self.aes.all_steps:
                step_data = {
                    'phase': step['phase'],
                    'round': step['round_num'],
                    'state_before': [[f'{b:02x}' for b in row] for row in step['state_before']],
                    'state_after': [[f'{b:02x}' for b in row] for row in step['state_after']],
                    'changes': step['changes']
                }
                data['steps'].append(step_data)
            
            json_str = json.dumps(data, indent=2)
            
            # Show in dialog
            dialog = tk.Toplevel(self.root)
            dialog.title(self.tr('export_title'))
            dialog.geometry("600x400")
            
            text = scrolledtext.ScrolledText(dialog, wrap=tk.WORD)
            text.pack(fill='both', expand=True, padx=10, pady=10)
            text.insert('1.0', json_str)
            
            def copy_json():
                self.root.clipboard_clear()
                self.root.clipboard_append(json_str)
                messagebox.showinfo(self.tr('export_title'), self.tr('export_copy_success'))
            
            ttk.Button(dialog, text=self.tr('copy_to_clipboard'), 
                      command=copy_json).pack(pady=5)
            
        except Exception as e:
            messagebox.showerror("Error", f"Export failed: {str(e)}")

# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Main entry point"""
    root = tk.Tk()
    app = AESVisualizerAdvanced(root)
    root.mainloop()

if __name__ == "__main__":
    main() 
                
