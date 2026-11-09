extends Node2D

const WORLD_WIDTH := 4400.0
const VIEW_HEIGHT := 720.0
const GROUND_Y := 580.0
const PLAYER_HALF_WIDTH := 19.0
const PLAYER_HEIGHT := 92.0
const WALK_SPEED := 285.0
const RUN_SPEED := 420.0
const JUMP_VELOCITY := -650.0
const GRAVITY := 1650.0

var player := Vector2(120.0, GROUND_Y)
var velocity := Vector2.ZERO
var camera_x := 0.0
var started := false
var briefed := false
var signal_found := false
var decision_pending := false
var ended := false
var facing := 1.0
var anim_time := 0.0
var caption_time := 0.0
var checkpoint_x := 120.0
var last_grounded := true
var outcome := ""

var gaps := [Vector2(1480, 1640), Vector2(2920, 3085)]
var crates := [Vector2(1040, GROUND_Y - 30), Vector2(2050, GROUND_Y - 34), Vector2(3370, GROUND_Y - 28)]
var hotspots := [
	{"x": 510.0, "kind": "dispatch", "name": "FLIGHT ORDERS"},
	{"x": 2390.0, "kind": "radio", "name": "DISTRESS SIGNAL"},
	{"x": 3990.0, "kind": "plane", "name": "AIRCRAFT 01"}
]

var hud: Label
var objective: Label
var prompt: Label
var caption_panel: PanelContainer
var caption_label: Label
var choice_panel: PanelContainer
var choice_label: Label
var choice_a: Button
var choice_b: Button

func _ready() -> void:
	_build_interface()
	set_caption("THE LAST FLIGHT\n\nMara was not supposed to be flying tonight. The orders arrived before sunrise. The reason did not.\n\nPress ENTER to enter the airfield.", 0.0)
	queue_redraw()

func _build_interface() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)

	hud = Label.new()
	hud.position = Vector2(28, 20)
	hud.size = Vector2(490, 62)
	hud.add_theme_color_override("font_color", Color("#f5eddd"))
	hud.add_theme_font_size_override("font_size", 17)
	hud.text = "COLLAPSIBLE TIME  /  CHAPTER 01"
	layer.add_child(hud)

	objective = Label.new()
	objective.position = Vector2(28, 82)
	objective.size = Vector2(650, 36)
	objective.add_theme_color_override("font_color", Color("#e8d5a7"))
	objective.add_theme_font_size_override("font_size", 15)
	objective.text = "OBJECTIVE  /  REPORT TO FLIGHT CONTROL"
	layer.add_child(objective)

	prompt = Label.new()
	prompt.position = Vector2(440, 514)
	prompt.size = Vector2(400, 34)
	prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt.add_theme_color_override("font_color", Color("#fff0cb"))
	prompt.add_theme_font_size_override("font_size", 18)
	layer.add_child(prompt)

	caption_panel = PanelContainer.new()
	caption_panel.position = Vector2(72, 574)
	caption_panel.size = Vector2(1136, 118)
	var caption_style := StyleBoxFlat.new()
	caption_style.bg_color = Color(0.055, 0.10, 0.13, 0.91)
	caption_style.border_color = Color("#c5a66e")
	caption_style.set_border_width_all(2)
	caption_style.set_corner_radius_all(5)
	caption_style.content_margin_left = 24
	caption_style.content_margin_right = 24
	caption_style.content_margin_top = 12
	caption_style.content_margin_bottom = 12
	caption_panel.add_theme_stylebox_override("panel", caption_style)
	layer.add_child(caption_panel)

	caption_label = Label.new()
	caption_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	caption_label.add_theme_color_override("font_color", Color("#f4efe3"))
	caption_label.add_theme_font_size_override("font_size", 17)
	caption_panel.add_child(caption_label)

	choice_panel = PanelContainer.new()
	choice_panel.position = Vector2(340, 218)
	choice_panel.size = Vector2(600, 286)
	var choice_style := StyleBoxFlat.new()
	choice_style.bg_color = Color(0.055, 0.10, 0.13, 0.97)
	choice_style.border_color = Color("#d9bb7e")
	choice_style.set_border_width_all(3)
	choice_style.set_corner_radius_all(7)
	choice_style.content_margin_left = 24
	choice_style.content_margin_right = 24
	choice_style.content_margin_top = 18
	choice_style.content_margin_bottom = 18
	choice_panel.add_theme_stylebox_override("panel", choice_style)
	layer.add_child(choice_panel)

	var choice_stack := VBoxContainer.new()
	choice_stack.add_theme_constant_override("separation", 12)
	choice_panel.add_child(choice_stack)

	choice_label = Label.new()
	choice_label.text = "THE SIGNAL IS BREAKING UP.\nTHE CLINIC IS STILL WAITING."
	choice_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	choice_label.add_theme_color_override("font_color", Color("#f4efe3"))
	choice_label.add_theme_font_size_override("font_size", 19)
	choice_stack.add_child(choice_label)

	choice_a = Button.new()
	choice_a.text = "1   Stay on course. Deliver the medical supplies."
	choice_a.custom_minimum_size = Vector2(0, 58)
	choice_a.pressed.connect(_choose_delivery)
	choice_stack.add_child(choice_a)

	choice_b = Button.new()
	choice_b.text = "2   Divert toward the distress signal."
	choice_b.custom_minimum_size = Vector2(0, 58)
	choice_b.pressed.connect(_choose_signal)
	choice_stack.add_child(choice_b)

	choice_panel.visible = false
	caption_panel.visible = true

func set_caption(message: String, duration: float = 8.0) -> void:
	caption_label.text = message
	caption_panel.visible = true
	caption_time = duration

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if not started and event.keycode == KEY_ENTER:
			started = true
			set_caption("AIRFIELD 07:10\n\nThe hangar doors are open. Your aircraft is waiting beyond the control building. Find the flight orders first.\n\nMove with A / D or the arrow keys. Jump with SPACE. Press E to interact.", 0.0)
			objective.text = "OBJECTIVE  /  FIND THE FLIGHT ORDERS"
		elif decision_pending and event.keycode == KEY_1:
			_choose_delivery()
		elif decision_pending and event.keycode == KEY_2:
			_choose_signal()
		elif ended and event.keycode == KEY_R:
			_restart_chapter()
		elif started and not ended and not decision_pending and event.keycode == KEY_E:
			_interact()

func _physics_process(delta: float) -> void:
	anim_time += delta
	if caption_time > 0.0:
		caption_time -= delta
		if caption_time <= 0.0 and not decision_pending and not ended:
			caption_panel.visible = false

	if started and not ended and not decision_pending:
		var direction := 0.0
		if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
			direction -= 1.0
		if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
			direction += 1.0

		if direction != 0.0:
			facing = sign(direction)
		var running := Input.is_key_pressed(KEY_SHIFT)
		var target_speed := RUN_SPEED if running else WALK_SPEED
		velocity.x = move_toward(velocity.x, direction * target_speed, 1800.0 * delta)

		var grounded := _is_grounded()
		if grounded and (Input.is_key_just_pressed(KEY_SPACE) or Input.is_key_just_pressed(KEY_W) or Input.is_key_just_pressed(KEY_UP)):
			velocity.y = JUMP_VELOCITY
			grounded = false
		if not grounded:
			velocity.y += GRAVITY * delta
		else:
			velocity.y = 0.0
			player.y = GROUND_Y

		var previous_x := player.x
		var next_x := clamp(player.x + velocity.x * delta, 30.0, WORLD_WIDTH - 50.0)
		if _hits_crate(next_x, player.y):
			next_x = previous_x
			velocity.x = 0.0
		player.x = next_x
		player.y += velocity.y * delta

		if _is_gap(player.x) and player.y >= GROUND_Y + 5.0 and player.y < 900.0:
			pass
		elif not _is_gap(player.x) and player.y >= GROUND_Y:
			player.y = GROUND_Y
			velocity.y = 0.0

		if player.y > 850.0:
			player.x = checkpoint_x
			player.y = GROUND_Y
			velocity = Vector2.ZERO
			set_caption("The broken runway gives way beneath you. You make it back to the last safe marker. Watch the ground and time your jump.", 6.0)

		if player.x > 2250.0:
			checkpoint_x = 2200.0

		camera_x = clamp(player.x - 440.0, 0.0, WORLD_WIDTH - 1280.0)
		_update_prompt()
		_update_hud()
		queue_redraw()

func _is_gap(x: float) -> bool:
	for gap in gaps:
		if x > gap.x and x < gap.y:
			return true
	return false

func _is_grounded() -> bool:
	return not _is_gap(player.x) and player.y >= GROUND_Y - 1.0

func _hits_crate(x: float, y: float) -> bool:
	var player_box := Rect2(x - PLAYER_HALF_WIDTH, y - PLAYER_HEIGHT, PLAYER_HALF_WIDTH * 2.0, PLAYER_HEIGHT)
	for crate in crates:
		var box := Rect2(crate.x - 27.0, crate.y - 28.0, 54.0, 58.0)
		if player_box.intersects(box) and y >= GROUND_Y - 4.0:
			return true
	return false

func _update_prompt() -> void:
	var nearest: Dictionary = {}
	var best := 99999.0
	for spot in hotspots:
		var distance: float = abs(player.x - float(spot.x))
		if distance < best:
			best = distance
			nearest = spot
	if best < 125.0:
		prompt.text = "E   INTERACT  /  " + str(nearest.name)
	else:
		prompt.text = "SHIFT  RUN     SPACE  JUMP     E  INTERACT"
		
func _update_hud() -> void:
	var phase := "AIRFIELD"
	if player.x > 1800.0:
		phase = "TAXIWAY"
	if player.x > 3100.0:
		phase = "FLIGHT LINE"
	hud.text = "COLLAPSIBLE TIME  /  CHAPTER 01     " + phase
	if not briefed:
		objective.text = "OBJECTIVE  /  REPORT TO FLIGHT CONTROL"
	elif not signal_found:
		objective.text = "OBJECTIVE  /  FIND THE SOURCE OF THE RADIO SIGNAL"
	else:
		objective.text = "OBJECTIVE  /  REACH YOUR AIRCRAFT"

func _interact() -> void:
	for spot in hotspots:
		if abs(player.x - float(spot.x)) < 125.0:
			match str(spot.kind):
				"dispatch":
					if not briefed:
						briefed = true
						set_caption("FLIGHT CONTROL\n\nYour orders: deliver emergency medical supplies to the Kijani clinic. Keep to the approved route. Do not divert.\n\nMARA\nI never agreed to this flight.\n\nCONTROL\nYou were selected. That is all you need to know.", 0.0)
						objective.text = "OBJECTIVE  /  FIND THE SOURCE OF THE RADIO SIGNAL"
					else:
						set_caption("The flight plan is locked. The destination is Kijani clinic. No diversions authorised.", 5.0)
				"radio":
					if not briefed:
						set_caption("The radio crackles. Flight orders first. You need to know what you are flying into.", 5.0)
					elif not signal_found:
						signal_found = true
						checkpoint_x = 2200.0
						set_caption("UNKNOWN TRANSMISSION\n\n...any aircraft... please respond. We have people waiting. The signal is coming from beyond the storm line.\n\nMARA\nControl, I have a second transmission.\n\nCONTROL\nIgnore it. Your orders have not changed.", 0.0)
						objective.text = "OBJECTIVE  /  REACH YOUR AIRCRAFT"
					else:
						set_caption("The signal repeats. A voice, then static. Someone is still out there.", 5.0)
				"plane":
					if not briefed:
						set_caption("A flight without orders is still a flight into the unknown. Check in with control first.", 5.0)
					elif not signal_found:
						set_caption("The engines are ready. But the radio signal is still unexplained. Investigate it before boarding.", 5.0)
					else:
						decision_pending = true
						choice_panel.visible = true
						caption_panel.visible = false
						prompt.text = "MAKE YOUR CHOICE  /  PRESS 1 OR 2"
			return

func _choose_delivery() -> void:
	_finish_choice("DELIVERY", "Mara keeps the aircraft on its assigned route. The clinic receives the medical supplies before the storm closes the valley. The unknown voice is not answered.\n\nSome promises are kept. Some questions remain.", "THE CLINIC RECEIVES ITS MEDICINE.\nTHE SIGNAL GOES QUIET.")

func _choose_signal() -> void:
	_finish_choice("SIGNAL", "Mara turns toward the unknown transmission. Control orders her back. She keeps flying. A second aircraft appears on the radar, matching her altitude and heading exactly.\n\nThe timeline has noticed her.", "SOMEONE ANSWERS.\nTHE RADAR SHOWS TWO MARAS.")

func _finish_choice(which: String, message: String, title: String) -> void:
	outcome = which
	decision_pending = false
	ended = true
	choice_panel.visible = false
	objective.text = "CHAPTER COMPLETE  /  YOUR CHOICE HAS CONSEQUENCES"
	set_caption(title + "\n\n" + message + "\n\nPress R to replay this chapter.", 0.0)
	prompt.text = "CHAPTER COMPLETE"

func _restart_chapter() -> void:
	player = Vector2(120.0, GROUND_Y)
	velocity = Vector2.ZERO
	camera_x = 0.0
	started = false
	briefed = false
	signal_found = false
	decision_pending = false
	ended = false
	checkpoint_x = 120.0
	outcome = ""
	choice_panel.visible = false
	objective.text = "OBJECTIVE  /  REPORT TO FLIGHT CONTROL"
	prompt.text = ""
	set_caption("THE LAST FLIGHT\n\nMara was not supposed to be flying tonight. The orders arrived before sunrise. The reason did not.\n\nPress ENTER to enter the airfield.", 0.0)
	queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(0, 0, WORLD_WIDTH, VIEW_HEIGHT), Color("#a9c0bb"))
	_draw_sky()
	draw_set_transform(Vector2(-camera_x, 0.0))
	_draw_backdrop()
	_draw_hangar()
	_draw_ground()
	_draw_obstacles()
	_draw_hotspots()
	_draw_aircraft()
	_draw_mara()
	draw_set_transform(Vector2.ZERO)

func _draw_sky() -> void:
	for i in range(7):
		var x := fposmod(float(i) * 265.0 - camera_x * 0.22, WORLD_WIDTH + 300.0)
		var y := 85.0 + float(i % 3) * 62.0
		_draw_cloud(x, y)

func _draw_cloud(x: float, y: float) -> void:
	var c := Color("#e8e4d8")
	draw_colored_polygon(PackedVector2Array([
		Vector2(x - 62, y + 15), Vector2(x - 44, y - 4), Vector2(x - 19, y - 8),
		Vector2(x - 5, y - 28), Vector2(x + 22, y - 23), Vector2(x + 42, y - 3),
		Vector2(x + 67, y + 5), Vector2(x + 55, y + 20), Vector2(x - 48, y + 24)
	]), c)

func _draw_backdrop() -> void:
	for layer in range(3):
		var color := [Color("#91a99f"), Color("#738e86"), Color("#58736e")][layer]
		var points := PackedVector2Array()
		points.append(Vector2(-100, GROUND_Y))
		for i in range(18):
			var x := float(i) * 280.0 - fposmod(camera_x * (0.10 + layer * 0.10), 280.0)
			var y := 390.0 + float((i * 7 + layer * 11) % 5) * 24.0 - float(layer) * 20.0
			points.append(Vector2(x, y))
		points.append(Vector2(WORLD_WIDTH, GROUND_Y))
		draw_colored_polygon(points, color)

func _draw_hangar() -> void:
	_draw_cutout([Vector2(190, 510), Vector2(190, 285), Vector2(320, 205), Vector2(700, 265), Vector2(700, 510)], Color("#d8d1bd"))
	_draw_cutout([Vector2(190, 285), Vector2(320, 205), Vector2(320, 510), Vector2(190, 510)], Color("#b6b7ad"))
	draw_rect(Rect2(365, 340, 280, 170), Color("#405b63"))
	for i in range(6):
		draw_line(Vector2(385 + i * 46, 345), Vector2(385 + i * 46, 510), Color("#d4cbb8"), 3.0)
	draw_line(Vector2(320, 205), Vector2(700, 265), Color("#f0e7d4"), 5.0)
	draw_string(ThemeDB.fallback_font, Vector2(240, 550), "KIJANI AIRFIELD", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("#f2ead9"))

func _draw_ground() -> void:
	var start := 0.0
	for gap in gaps:
		draw_rect(Rect2(start, GROUND_Y, gap.x - start, 160), Color("#66766f"))
		draw_rect(Rect2(start, GROUND_Y, gap.x - start, 12), Color("#e1d5bc"))
		draw_rect(Rect2(gap.y, GROUND_Y, WORLD_WIDTH - gap.y, 160), Color("#66766f"))
		draw_rect(Rect2(gap.y, GROUND_Y, WORLD_WIDTH - gap.y, 12), Color("#e1d5bc"))
		draw_rect(Rect2(gap.x, GROUND_Y + 4, gap.y - gap.x, 160), Color("#243d43"))
		draw_line(Vector2(gap.x, GROUND_Y), Vector2(gap.x + 24, GROUND_Y + 22), Color("#d5b979"), 4.0)
		draw_line(Vector2(gap.y, GROUND_Y), Vector2(gap.y - 24, GROUND_Y + 22), Color("#d5b979"), 4.0)
		start = gap.y
	for i in range(24):
		var x := 60.0 + i * 185.0
		draw_rect(Rect2(x, 628, 65, 5), Color("#d9c9a9"))

func _draw_obstacles() -> void:
	for crate in crates:
		var x: float = crate.x
		var y: float = crate.y
		_draw_cutout([Vector2(x - 28, y - 28), Vector2(x - 17, y - 44), Vector2(x + 28, y - 38), Vector2(x + 28, y + 28), Vector2(x - 28, y + 28)], Color("#b58b61"))
		draw_line(Vector2(x - 20, y - 20), Vector2(x + 18, y + 18), Color("#604d3d"), 4.0)
		draw_line(Vector2(x + 18, y - 24), Vector2(x - 18, y + 20), Color("#604d3d"), 4.0)

func _draw_hotspots() -> void:
	for spot in hotspots:
		var x: float = spot.x
		var color := Color("#e5c887")
		if spot.kind == "radio":
			color = Color("#c4d8d2")
		if spot.kind == "plane":
			color = Color("#e7d6b3")
		draw_circle(Vector2(x, 478), 23.0 + sin(anim_time * 2.4) * 4.0, Color(color, 0.18))
		draw_circle(Vector2(x, 478), 8.0, color)
		draw_line(Vector2(x, 490), Vector2(x, 535), color, 3.0)
		draw_string(ThemeDB.fallback_font, Vector2(x - 78, 454), str(spot.name), HORIZONTAL_ALIGNMENT_CENTER, 156, 13, Color("#f5eddd"))

func _draw_aircraft() -> void:
	var x := 3900.0
	_draw_cutout([Vector2(x - 185, 505), Vector2(x - 145, 468), Vector2(x + 128, 468), Vector2(x + 190, 495), Vector2(x + 130, 516), Vector2(x - 155, 516)], Color("#eee9dc"))
	_draw_cutout([Vector2(x - 35, 472), Vector2(x + 15, 350), Vector2(x + 42, 350), Vector2(x + 25, 472)], Color("#c2c4bb"))
	_draw_cutout([Vector2(x - 24, 513), Vector2(x + 18, 568), Vector2(x + 48, 568), Vector2(x + 25, 513)], Color("#b7bbb2"))
	draw_line(Vector2(x - 130, 486), Vector2(x + 130, 486), Color("#8b9d9a"), 3.0)
	draw_circle(Vector2(x - 180, 495), 7.0, Color("#e5c887"))

func _draw_mara() -> void:
	var x := player.x
	var y := player.y
	var moving := abs(velocity.x) > 25.0 and y >= GROUND_Y - 2.0
	var stride := sin(anim_time * (14.0 if Input.is_key_pressed(KEY_SHIFT) else 9.0)) * (15.0 if moving else 0.0)
	var lean := -0.10 if moving and facing > 0 else (0.10 if moving else 0.0)
	draw_set_transform(Vector2(x, y), lean, Vector2(facing, 1.0))
	# Folded paper shadow
	draw_colored_polygon(PackedVector2Array([Vector2(-35, 2), Vector2(-20, -5), Vector2(28, -5), Vector2(40, 2)]), Color(0.12, 0.19, 0.20, 0.35))
	# Legs and boots
	_draw_cutout([Vector2(-19, -74), Vector2(-4, -74), Vector2(-8 + stride, -13), Vector2(-26 + stride, -9)], Color("#344d58"))
	_draw_cutout([Vector2(4, -74), Vector2(19, -74), Vector2(25 - stride, -12), Vector2(8 - stride, -9)], Color("#263b45"))
	_draw_cutout([Vector2(-31 + stride, -8), Vector2(-4 + stride, -8), Vector2(-3 + stride, 0), Vector2(-36 + stride, 0)], Color("#1d2d36"))
	_draw_cutout([Vector2(7 - stride, -8), Vector2(35 - stride, -8), Vector2(39 - stride, 0), Vector2(8 - stride, 0)], Color("#1d2d36"))
	# Flight suit, folded panels and harness
	_draw_cutout([Vector2(-34, -218), Vector2(31, -218), Vector2(42, -82), Vector2(22, -63), Vector2(-25, -63), Vector2(-42, -83)], Color("#708b91"))
	_draw_cutout([Vector2(-34, -218), Vector2(-3, -208), Vector2(-8, -65), Vector2(-25, -63), Vector2(-42, -83)], Color("#506d79"))
	_draw_cutout([Vector2(31, -218), Vector2(5, -208), Vector2(8, -65), Vector2(22, -63), Vector2(42, -83)], Color("#91a5a0"))
	draw_line(Vector2(-18, -193), Vector2(20, -193), Color("#d9bd7e"), 4.0)
	draw_line(Vector2(-4, -204), Vector2(5, -84), Color("#d9bd7e"), 3.0)
	# Arms swing
	draw_line(Vector2(-29, -199), Vector2(-37 + stride * 0.6, -130), Color("#506d79"), 17.0)
	draw_line(Vector2(29, -199), Vector2(38 - stride * 0.6, -132), Color("#91a5a0"), 17.0)
	draw_circle(Vector2(-37 + stride * 0.6, -127), 8.0, Color("#a9755d"))
	draw_circle(Vector2(38 - stride * 0.6, -129), 8.0, Color("#a9755d"))
	# Neck, face and hair
	draw_rect(Rect2(-9, -249, 18, 31), Color("#a9755d"))
	draw_colored_polygon(PackedVector2Array([Vector2(-28, -295), Vector2(-23, -326), Vector2(0, -339), Vector2(25, -325), Vector2(31, -294), Vector2(25, -254), Vector2(7, -237), Vector2(-15, -244)]), Color("#a9755d"))
	draw_colored_polygon(PackedVector2Array([Vector2(-32, -295), Vector2(-29, -331), Vector2(-7, -352), Vector2(22, -344), Vector2(39, -315), Vector2(30, -278), Vector2(19, -304), Vector2(-6, -309), Vector2(-22, -280)]), Color("#302a2c"))
	draw_colored_polygon(PackedVector2Array([Vector2(-26, -291), Vector2(-36, -270), Vector2(-31, -238), Vector2(-20, -229), Vector2(-17, -273)]), Color("#29252b"))
	draw_circle(Vector2(-10, -289), 2.6, Color("#28272a"))
	draw_circle(Vector2(11, -289), 2.6, Color("#28272a"))
	draw_line(Vector2(-5, -265), Vector2(5, -264), Color("#704a43"), 1.5)
	draw_string(ThemeDB.fallback_font, Vector2(-24, -187), "CT", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color("#f4ead5"))
	draw_set_transform(Vector2(-camera_x, 0.0))

func _draw_cutout(points: Array, color: Color) -> void:
	var packed := PackedVector2Array()
	for point in points:
		packed.append(point)
	draw_colored_polygon(packed, Color(0.12, 0.16, 0.17, 0.18))
	var shifted := PackedVector2Array()
	for point in points:
		shifted.append(point + Vector2(-5, -6))
	draw_colored_polygon(shifted, color)
	draw_polyline(shifted, Color(0.16, 0.22, 0.23, 0.65), 2.0, true)
