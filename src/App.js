import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.ts";

const App = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTodos();

    const channel = supabase
      .channel('public:todo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todo' }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTodos((prev) => [...prev, payload.new]);
        } else if (payload.eventType === "DELETE") {
          setTodos((prev) => prev.filter((todo) => todo.id !== payload.old.id));
        } else if (payload.eventType === "UPDATE") {
          setTodos((prev) =>
            prev.map((todo) =>
              todo.id === payload.new.id ? { ...todo, ...payload.new } : todo
            )
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTodos = async () => {
    const { data, error } = await supabase.from("todo").select("*");
    if (error) setError("Error fetching todos");
    else setTodos(data || []);
  };

  const addTodo = async () => {
    try {
      if (newTodo.trim() === "") throw new Error("Todo cannot be empty");

      const { data, error } = await supabase
        .from("todo")
        .insert([{ title: newTodo, completed: false }])
        .select("*");

      if (error) throw error;

      setTodos((prev) => [...prev, ...(data || [])]);
      setNewTodo("");
    } catch (err) {
      setError(err.message || "Unknown error occurred");
    }
  };

  const deleteTodo = async (id) => {
    const { error } = await supabase.from("todo").delete().eq("id", id);
    if (error) setError("Error deleting todo");
    else setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const toggleTodo = async (id, completed) => {
    const { error } = await supabase
      .from("todo")
      .update({ completed: !completed })
      .eq("id", id);
    if (error) setError("Error toggling todo");
    else
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, completed: !completed } : todo
        )
      );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Supabase Todo App</h1>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo"
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span
              onClick={() => toggleTodo(todo.id, todo.completed)}
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
                cursor: "pointer",
              }}
            >
              {todo.title}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
