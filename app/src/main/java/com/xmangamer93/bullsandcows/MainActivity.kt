package com.xmangamer93.bullsandcows

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { BullsAndCowsApp() }
    }
}

private data class GuessResult(val number: String, val bulls: Int, val cows: Int)

private val pageTop = Color(0xFF10182B)
private val pageBottom = Color(0xFF090E1A)
private val panel = Color(0xFF1B2740)
private val accent = Color(0xFF9AB0FF)
private val mint = Color(0xFF52D6B5)
private val muted = Color(0xFFAAB6CC)

@Composable
fun BullsAndCowsApp() {
    var secret by rememberSaveable { mutableStateOf(makeSecret()) }
    var guess by rememberSaveable { mutableStateOf("") }
    var attempts by rememberSaveable { mutableIntStateOf(0) }
    var best by rememberSaveable { mutableIntStateOf(0) }
    var won by rememberSaveable { mutableStateOf(false) }
    var message by rememberSaveable { mutableStateOf("") }
    val history = remember { mutableStateListOf<GuessResult>() }

    fun restart() {
        secret = makeSecret()
        guess = ""
        attempts = 0
        won = false
        message = ""
        history.clear()
    }

    fun submitGuess() {
        if (won) return
        if (guess.length != 4 || guess.toSet().size != 4) {
            message = "اكتب ٤ أرقام مختلفة من فضلك"
            return
        }
        if (history.any { it.number == guess }) {
            message = "جربت الرقم ده قبل كده"
            return
        }
        val bulls = guess.indices.count { guess[it] == secret[it] }
        val cows = guess.count { it in secret } - bulls
        attempts++
        history.add(0, GuessResult(guess, bulls, cows))
        message = ""
        if (bulls == 4) {
            won = true
            if (best == 0 || attempts < best) best = attempts
        }
        guess = ""
    }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Surface(Modifier.fillMaxSize(), color = pageBottom) {
            Box(
                Modifier.fillMaxSize().background(
                    Brush.verticalGradient(listOf(pageTop, pageBottom))
                )
            ) {
                Column(
                    Modifier.fillMaxSize().padding(horizontal = 20.dp, vertical = 22.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("لعبة الذكاء", color = mint, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Text("الأبقار والثيران", color = Color.White, fontSize = 29.sp, fontWeight = FontWeight.ExtraBold)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "اكتشف الرقم السري المكوّن من ٤ أرقام مختلفة",
                        color = muted, fontSize = 14.sp, textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(22.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StatCard("المحاولات", attempts.toString(), Modifier.weight(1f))
                        StatCard("أفضل نتيجة", if (best == 0) "—" else best.toString(), Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(18.dp))
                    Card(
                        Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = panel),
                        shape = RoundedCornerShape(24.dp)
                    ) {
                        Column(Modifier.padding(18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("اكتب تخمينك", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(6.dp))
                            Text(
                                "الثور: رقم صحيح في مكانه • البقرة: رقم صحيح في مكان مختلف",
                                color = muted, fontSize = 12.sp, textAlign = TextAlign.Center
                            )
                            Spacer(Modifier.height(16.dp))
                            OutlinedTextField(
                                value = guess,
                                onValueChange = { value ->
                                    guess = value.mapNotNull { c ->
                                        when (c) {
                                            in '0'..'9' -> c
                                            in '٠'..'٩' -> ('0'.code + (c.code - '٠'.code)).toChar()
                                            in '۰'..'۹' -> ('0'.code + (c.code - '۰'.code)).toChar()
                                            else -> null
                                        }.takeIf { it.isDigit() }
                                    }.joinToString("").take(4)
                                    message = ""
                                },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                placeholder = { Text("مثال: ١٢٣٤", color = muted) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                textStyle = MaterialTheme.typography.headlineSmall.copy(
                                    color = Color.White, textAlign = TextAlign.Center,
                                    letterSpacing = 8.sp, fontWeight = FontWeight.Bold
                                ),
                                enabled = !won
                            )
                            if (message.isNotBlank()) {
                                Spacer(Modifier.height(8.dp))
                                Text(message, color = Color(0xFFFFA5A5), fontSize = 13.sp)
                            }
                            Spacer(Modifier.height(14.dp))
                            Button(
                                onClick = { submitGuess() },
                                Modifier.fillMaxWidth().height(52.dp),
                                enabled = !won,
                                colors = ButtonDefaults.buttonColors(containerColor = accent),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Text("جرّب الرقم", color = Color(0xFF10182B), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                            if (won) {
                                Spacer(Modifier.height(16.dp))
                                Text("🎉 أحسنت! اكتشفت الرقم السري: $secret", color = mint, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                            }
                            TextButton(onClick = { restart() }) {
                                Text("لعبة جديدة", color = mint, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    Spacer(Modifier.height(18.dp))
                    Row(
                        Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("سجل المحاولات", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                        Text("${history.size} محاولة", color = muted, fontSize = 12.sp)
                    }
                    Spacer(Modifier.height(8.dp))
                    if (history.isEmpty()) {
                        Card(
                            Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = panel.copy(alpha = 0.65f)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text(
                                "لسه مفيش محاولات — ابدأ وخمّن الرقم!",
                                Modifier.fillMaxWidth().padding(18.dp),
                                color = muted, textAlign = TextAlign.Center, fontSize = 13.sp
                            )
                        }
                    } else {
                        LazyColumn(
                            Modifier.fillMaxWidth().weight(1f, fill = false),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(history) { GuessRow(it) }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text("فكّر بذكاء… وكل محاولة تقرّبك من الحل", color = muted, fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier,
        colors = CardDefaults.cardColors(containerColor = panel.copy(alpha = 0.88f)),
        shape = RoundedCornerShape(18.dp)
    ) {
        Column(
            Modifier.fillMaxWidth().padding(vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(label, color = muted, fontSize = 12.sp)
            Spacer(Modifier.height(4.dp))
            Text(value, color = Color.White, fontSize = 23.sp, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
private fun GuessRow(item: GuessResult) {
    Card(
        Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = panel.copy(alpha = 0.72f)),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(item.number, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold, letterSpacing = 4.sp)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("🐂 ${item.bulls}", color = mint, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Spacer(Modifier.width(12.dp))
                Text("🐄 ${item.cows}", color = accent, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    }
}

private fun makeSecret(): String = (0..9).shuffled().take(4).joinToString("")
